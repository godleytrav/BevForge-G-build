import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOpsMobile } from "@/features/ops-mobile/provider";
import { mobileGlassClass } from "@/features/ops-mobile/ui";
import {
  fetchPlaceDetailsOnImport,
  searchPlacesExplicit,
  type PlaceSearchResult,
} from "@/pages/ops/geo/google-places";
import {
  saveOpsCrmActivityRecord,
  saveOpsCrmTaskRecord,
  saveOpsLeadRecord,
  type OpsLeadStage,
} from "@/pages/ops/crm/data";
import { ArrowRight, MapPinned, Search, Store } from "lucide-react";

interface VisitFormState {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  googlePlaceId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  desiredProductId: string;
  desiredProductsNote: string;
  estimatedQuantity: string;
  cadence: string;
  followUpStage: OpsLeadStage;
  followUpDate: string;
  notes: string;
}

const defaultFormState: VisitFormState = {
  businessName: "",
  contactName: "",
  phone: "",
  email: "",
  website: "",
  googlePlaceId: "",
  address: "",
  city: "",
  state: "CA",
  zip: "",
  lat: 0,
  lng: 0,
  desiredProductId: "",
  desiredProductsNote: "",
  estimatedQuantity: "",
  cadence: "weekly",
  followUpStage: "prospect",
  followUpDate: "",
  notes: "",
};

const parseAddressParts = (
  formattedAddress: string,
): Partial<Pick<VisitFormState, "city" | "state" | "zip">> => {
  const parts = formattedAddress
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length < 2) {
    return {};
  }

  const stateZipPart = parts.length >= 2 ? parts[parts.length - 2] : "";
  const cityPart = parts.length >= 3 ? parts[parts.length - 3] : undefined;
  const stateZipMatch = stateZipPart.match(/\b([A-Z]{2})\b(?:\s+(\d{5}(?:-\d{4})?))?/);

  return {
    city: cityPart,
    state: stateZipMatch?.[1],
    zip: stateZipMatch?.[2],
  };
};

export default function OpsMobileVisitNewPage() {
  const [searchParams] = useSearchParams();
  const { state, view, enqueueQueueEvent } = useOpsMobile();
  const [form, setForm] = useState<VisitFormState>(defaultFormState);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [placeSearchQuery, setPlaceSearchQuery] = useState("");
  const [placeSearchResults, setPlaceSearchResults] = useState<PlaceSearchResult[]>([]);
  const [placeSearchPending, setPlaceSearchPending] = useState(false);
  const [placeSearchMessage, setPlaceSearchMessage] = useState<string | null>(null);
  const [placeImportPending, setPlaceImportPending] = useState<string | null>(null);

  const accountId = searchParams.get("accountId");
  const prefillAccount =
    (accountId
      ? view.accounts.find((candidate) => candidate.id === accountId)
      : undefined) ?? null;

  useEffect(() => {
    if (!prefillAccount) {
      return;
    }

    setForm((current) => ({
      ...current,
      businessName: current.businessName || prefillAccount.name,
      address: current.address || prefillAccount.address,
      phone: current.phone || prefillAccount.phone,
      email: current.email || prefillAccount.email,
    }));
    setPlaceSearchQuery((current) =>
      current.trim().length > 0 ? current : prefillAccount.name,
    );
  }, [prefillAccount]);

  const handlePlaceSearch = async () => {
    const query = placeSearchQuery.trim();
    if (!query) {
      setPlaceSearchMessage("Enter a business name to search Google Places.");
      return;
    }

    setPlaceSearchPending(true);
    setPlaceSearchMessage(null);

    try {
      const results = await searchPlacesExplicit({
        mode: "text",
        query,
        explicitUserAction: true,
      });
      setPlaceSearchResults(results);
      setPlaceSearchMessage(
        results.length > 0
          ? `Found ${results.length} Google result${results.length === 1 ? "" : "s"}.`
          : "No Google Places matched that search.",
      );
    } catch (error) {
      setPlaceSearchResults([]);
      setPlaceSearchMessage(
        error instanceof Error ? error.message : "Failed to search Google Places.",
      );
    } finally {
      setPlaceSearchPending(false);
    }
  };

  const importPlaceIntoForm = async (result: PlaceSearchResult) => {
    setPlaceImportPending(result.placeId);
    setPlaceSearchMessage(null);

    try {
      const details = await fetchPlaceDetailsOnImport({
        placeId: result.placeId,
        explicitImportClick: true,
      });
      const parsedAddress = parseAddressParts(details.formattedAddress);
      setForm((current) => ({
        ...current,
        businessName: details.name || current.businessName,
        phone: details.phone || current.phone,
        email: current.email,
        website: details.website || current.website,
        googlePlaceId: details.placeId,
        address: details.formattedAddress || current.address,
        city: parsedAddress.city || current.city,
        state: parsedAddress.state || current.state,
        zip: parsedAddress.zip || current.zip,
        lat: details.location?.lat ?? current.lat,
        lng: details.location?.lng ?? current.lng,
      }));
      setPlaceSearchMessage(`Imported ${details.name} into the visit form.`);
    } catch (error) {
      setPlaceSearchMessage(
        error instanceof Error ? error.message : "Failed to import place details.",
      );
    } finally {
      setPlaceImportPending(null);
    }
  };

  const selectedProduct = useMemo(
    () =>
      state.data.products.find(
        (product) => product.id === form.desiredProductId,
      ) ?? null,
    [form.desiredProductId, state.data.products],
  );

  const handleSubmit = () => {
    if (!form.businessName.trim()) {
      setSavedMessage("Business name is required before saving a visit.");
      return;
    }

    const desiredProductLabel =
      selectedProduct?.name || form.desiredProductsNote.trim() || "No product selected";
    const leadNotes = [
      form.notes.trim(),
      `Interest: ${form.followUpStage}`,
      `Desired products: ${desiredProductLabel}`,
      `Estimated quantity: ${form.estimatedQuantity.trim() || "n/a"}`,
      `Cadence: ${form.cadence}`,
    ]
      .filter((value) => value.length > 0)
      .join("\n");

    const result = saveOpsLeadRecord({
      name: form.businessName,
      owner: form.contactName || "OPS Mobile",
      stage: form.followUpStage,
      source: "manual",
      googlePlaceId: form.googlePlaceId || undefined,
      phone: form.phone,
      email: form.email,
      website: form.website,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      notes: leadNotes,
      lat: form.lat,
      lng: form.lng,
    });

    saveOpsCrmActivityRecord({
      type: "warm_visit",
      at: new Date().toISOString(),
      note: leadNotes,
      actor: "OPS Mobile",
      entityRef: {
        entityType: "lead",
        entityId: result.record.id,
      },
    });

    if (form.followUpDate) {
      const dueAt = new Date(`${form.followUpDate}T09:00:00`).toISOString();
      saveOpsCrmTaskRecord({
        title: `Follow up with ${form.businessName}`,
        dueAt,
        urgent: form.followUpStage === "qualified",
        assignedUserId: "ops-mobile",
        status: "open",
        notes: leadNotes,
        entityRef: {
          entityType: "lead",
          entityId: result.record.id,
        },
      });
    }

    enqueueQueueEvent({
      type: "lead_created",
      summary:
        result.status === "duplicate"
          ? `Matched existing lead for ${result.record.name}`
          : `Captured warm visit for ${result.record.name}`,
      detail: leadNotes,
      accountId: prefillAccount?.id,
      payload: {
        leadId: result.record.id,
        desiredProductId: selectedProduct?.id,
        desiredProductName: desiredProductLabel,
        estimatedQuantity: form.estimatedQuantity,
        cadence: form.cadence,
        followUpStage: form.followUpStage,
        followUpDate: form.followUpDate,
        googlePlaceId: form.googlePlaceId,
      },
    });

    setSavedMessage(
      result.status === "duplicate"
        ? `Existing lead matched for ${result.record.name}. Activity and follow-up were appended locally.`
        : `Warm visit saved locally for ${result.record.name}.`,
    );

    setForm((current) => ({
      ...defaultFormState,
      state: current.state,
    }));
  };

  return (
    <div className="space-y-4">
      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Store className="h-5 w-5" />
            Warm visit capture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prefillAccount ? (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
              Prefilled from existing account <span className="font-semibold">{prefillAccount.name}</span>.
            </div>
          ) : null}

          {savedMessage ? (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/12 p-4 text-sm text-emerald-100">
              {savedMessage}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-300/20 bg-slate-950/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-cyan-100">
                      Google place import
                    </p>
                    <p className="mt-1 text-sm text-cyan-50/75">
                      Search a venue name and import contact/location details into
                      this mobile visit form.
                    </p>
                  </div>
                  <MapPinned className="mt-0.5 h-5 w-5 text-cyan-100" />
                </div>

                <div className="mt-4 flex gap-2">
                  <Input
                    value={placeSearchQuery}
                    onChange={(event) => setPlaceSearchQuery(event.target.value)}
                    placeholder="Search business name"
                    className="border-cyan-300/20 bg-slate-950/55 text-white placeholder:text-white/35"
                  />
                  <Button
                    type="button"
                    className="rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                    onClick={() => {
                      void handlePlaceSearch();
                    }}
                    disabled={placeSearchPending}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {placeSearchPending ? "Searching..." : "Search"}
                  </Button>
                </div>

                {placeSearchMessage ? (
                  <p className="mt-3 text-sm text-cyan-50/80">{placeSearchMessage}</p>
                ) : null}

                {placeSearchResults.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {placeSearchResults.slice(0, 5).map((result) => (
                      <div
                        key={result.placeId}
                        className="rounded-2xl border border-cyan-300/15 bg-slate-950/55 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {result.name}
                            </p>
                            <p className="mt-1 text-sm text-white/65">
                              {result.address || "Address unavailable"}
                            </p>
                            {(typeof result.rating === "number" ||
                              typeof result.userRatingsTotal === "number") ? (
                              <p className="mt-1 text-xs text-white/45">
                                Rating {result.rating?.toFixed(1) ?? "n/a"} ·{" "}
                                {result.userRatingsTotal ?? 0} reviews
                              </p>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full border-white/15 bg-slate-950/40 text-white hover:bg-slate-900/60"
                            onClick={() => {
                              void importPlaceIntoForm(result);
                            }}
                            disabled={placeImportPending === result.placeId}
                          >
                            {placeImportPending === result.placeId ? "Importing..." : "Import"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-white/75">Business name</Label>
                <Input
                  value={form.businessName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      businessName: event.target.value,
                    }))
                  }
                  className="border-white/12 bg-slate-950/40 text-white placeholder:text-white/35"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/75">Contact</Label>
                  <Input
                    value={form.contactName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contactName: event.target.value,
                      }))
                    }
                    className="border-white/12 bg-slate-950/40 text-white placeholder:text-white/35"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/75">Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="border-white/12 bg-slate-950/40 text-white placeholder:text-white/35"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/75">Email</Label>
                <Input
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="border-white/12 bg-slate-950/40 text-white placeholder:text-white/35"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/75">Website</Label>
                <Input
                  value={form.website}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      website: event.target.value,
                    }))
                  }
                  className="border-white/12 bg-slate-950/40 text-white placeholder:text-white/35"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/75">Street address</Label>
                <Input
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  className="border-white/12 bg-slate-950/40 text-white placeholder:text-white/35"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[1.2fr_0.7fr_0.7fr]">
                <div className="space-y-2">
                  <Label className="text-white/75">City</Label>
                  <Input
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    className="border-white/12 bg-slate-950/40 text-white placeholder:text-white/35"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/75">State</Label>
                  <Input
                    value={form.state}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        state: event.target.value,
                      }))
                    }
                    className="border-white/12 bg-slate-950/40 text-white placeholder:text-white/35"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/75">ZIP</Label>
                  <Input
                    value={form.zip}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        zip: event.target.value,
                      }))
                    }
                    className="border-white/12 bg-slate-950/40 text-white placeholder:text-white/35"
                  />
                </div>
              </div>

              {form.googlePlaceId ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                    Google place ID
                  </p>
                  <p className="mt-2 break-all text-sm text-white/80">
                    {form.googlePlaceId}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/75">Desired product</Label>
                <Select
                  value={form.desiredProductId || "none"}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      desiredProductId: value === "none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger className="border-white/12 bg-slate-950/40 text-white">
                    <SelectValue placeholder="Choose product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No product selected</SelectItem>
                    {state.data.products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white/75">Additional desired products</Label>
                <Input
                  value={form.desiredProductsNote}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      desiredProductsNote: event.target.value,
                    }))
                  }
                  placeholder="Seasonals, kegs, can formats..."
                  className="border-white/12 bg-slate-950/40 text-white placeholder:text-white/35"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/75">Estimated quantity</Label>
                  <Input
                    value={form.estimatedQuantity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        estimatedQuantity: event.target.value,
                      }))
                    }
                    placeholder="8 cases / 4 kegs"
                    className="border-white/12 bg-slate-950/40 text-white placeholder:text-white/35"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/75">Cadence</Label>
                  <Select
                    value={form.cadence}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        cadence: value,
                      }))
                    }
                  >
                    <SelectTrigger className="border-white/12 bg-slate-950/40 text-white">
                      <SelectValue placeholder="Cadence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-off">One-off</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Biweekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/75">Follow-up state</Label>
                  <Select
                    value={form.followUpStage}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        followUpStage: value as OpsLeadStage,
                      }))
                    }
                  >
                    <SelectTrigger className="border-white/12 bg-slate-950/40 text-white">
                      <SelectValue placeholder="Follow-up state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="lost">Do not pursue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/75">Next follow-up date</Label>
                  <Input
                    type="date"
                    value={form.followUpDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        followUpDate: event.target.value,
                      }))
                    }
                    className="border-white/12 bg-slate-950/40 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/75">Visit notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="What they asked for, tasting notes, objections, next steps..."
                  className="min-h-32 border-white/12 bg-slate-950/40 text-white placeholder:text-white/35"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              onClick={handleSubmit}
            >
              Save warm visit
            </Button>
            <Badge className="border-white/15 bg-slate-950/35 text-white/75">
              Sync will remain local until an OPS CRM write API exists
            </Badge>
            {prefillAccount ? (
              <Link
                to={`/ops/mobile/accounts/${prefillAccount.id}`}
                className="inline-flex items-center gap-2 text-sm text-cyan-100"
              >
                Open account
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
