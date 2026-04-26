import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createOrder, listOrders, updateOrder } from './orders-store';

const resolveRepoRoot = (): string => {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, 'apps', 'ops-ui'))) {
    return cwd;
  }
  if (cwd.endsWith(path.join('apps', 'ops-ui'))) {
    return path.resolve(cwd, '../..');
  }
  return cwd;
};

const repoRoot = resolveRepoRoot();
const ordersFile = path.join(repoRoot, 'commissioning', 'ops', 'orders.json');
const idempotencyFile = path.join(repoRoot, 'commissioning', 'ops', 'orders-idempotency.json');

const createdOrderIds: string[] = [];
const usedIdempotencyRefs: Array<{ key: string; scope: string }> = [];

afterEach(async () => {
  const orderIdsToRemove = [...createdOrderIds];
  const refsToRemove = [...usedIdempotencyRefs];
  createdOrderIds.length = 0;
  usedIdempotencyRefs.length = 0;

  if (existsSync(ordersFile) && orderIdsToRemove.length > 0) {
    try {
      const parsed = JSON.parse(await fs.readFile(ordersFile, 'utf8')) as {
        orders?: Array<{ id?: string }>;
        updatedAt?: string;
      };
      parsed.orders = (parsed.orders ?? []).filter(
        (order) => !orderIdsToRemove.includes(order.id ?? '')
      );
      parsed.updatedAt = new Date().toISOString();
      await fs.writeFile(ordersFile, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
    } catch {
      // Cleanup should never fail tests.
    }
  }

  if (existsSync(idempotencyFile) && refsToRemove.length > 0) {
    try {
      const parsed = JSON.parse(await fs.readFile(idempotencyFile, 'utf8')) as {
        entries?: Array<{ key?: string; scope?: string; order_id?: string }>;
        updatedAt?: string;
      };
      parsed.entries = (parsed.entries ?? []).filter((entry) => {
        const key = entry.key ?? '';
        const scope = entry.scope ?? '';
        const orderId = entry.order_id ?? '';
        if (orderIdsToRemove.includes(orderId)) {
          return false;
        }
        return !refsToRemove.some((ref) => ref.key === key && ref.scope === scope);
      });
      parsed.updatedAt = new Date().toISOString();
      await fs.writeFile(idempotencyFile, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
    } catch {
      // Cleanup should never fail tests.
    }
  }
});

describe('orders-store', () => {
  it('enforces status transitions', async () => {
    const created = await createOrder({
      customer_name: 'Transition Test Account',
      order_date: '2026-03-09',
      line_items: [{ item_name: 'Test Keg', qty: 1, price: 98 }],
    });

    createdOrderIds.push(created.order.id);

    const approved = await updateOrder(created.order.id, {
      status: 'approved',
    });
    expect(approved.order?.status).toBe('approved');

    await expect(
      updateOrder(created.order.id, {
        status: 'delivered',
      })
    ).rejects.toThrow('invalid status transition');
  });

  it('replays create requests when idempotency key matches', async () => {
    const key = `orders-create-idem-${Date.now().toString(36)}`;
    usedIdempotencyRefs.push({ key, scope: 'create' });

    const payload = {
      customer_name: 'Idempotent Create Account',
      order_date: '2026-03-09',
      line_items: [{ item_name: 'Idem Case', qty: 2, price: 24 }],
    };

    const first = await createOrder(payload, { idempotencyKey: key });
    const second = await createOrder(payload, { idempotencyKey: key });

    createdOrderIds.push(first.order.id);

    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);
    expect(second.order.id).toBe(first.order.id);

    const all = await listOrders();
    const matches = all.filter((order) => order.id === first.order.id);
    expect(matches).toHaveLength(1);
  });

  it('rejects create idempotency key reuse with different payload', async () => {
    const key = `orders-create-conflict-${Date.now().toString(36)}`;
    usedIdempotencyRefs.push({ key, scope: 'create' });

    const first = await createOrder(
      {
        customer_name: 'Conflict Create Account',
        order_date: '2026-03-09',
        line_items: [{ item_name: 'Conflict Case', qty: 1, price: 20 }],
      },
      { idempotencyKey: key }
    );
    createdOrderIds.push(first.order.id);

    await expect(
      createOrder(
        {
          customer_name: 'Conflict Create Account',
          order_date: '2026-03-09',
          line_items: [{ item_name: 'Conflict Case', qty: 3, price: 20 }],
        },
        { idempotencyKey: key }
      )
    ).rejects.toThrow('idempotency key already used with different payload');
  });

  it('replays update requests when idempotency key matches', async () => {
    const created = await createOrder({
      customer_name: 'Idempotent Update Account',
      order_date: '2026-03-09',
      line_items: [{ item_name: 'Update Keg', qty: 1, price: 75 }],
    });
    createdOrderIds.push(created.order.id);

    const key = `orders-update-idem-${Date.now().toString(36)}`;
    const scope = `update:${created.order.id}`;
    usedIdempotencyRefs.push({ key, scope });

    const first = await updateOrder(
      created.order.id,
      {
        status: 'confirmed',
      },
      { idempotencyKey: key }
    );
    const second = await updateOrder(
      created.order.id,
      {
        status: 'confirmed',
      },
      { idempotencyKey: key }
    );

    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);
    expect(first.order?.status).toBe('confirmed');
    expect(second.order?.status).toBe('confirmed');

    await expect(
      updateOrder(
        created.order.id,
        {
          status: 'approved',
        },
        { idempotencyKey: key }
      )
    ).rejects.toThrow('idempotency key already used with different payload');
  });
});
