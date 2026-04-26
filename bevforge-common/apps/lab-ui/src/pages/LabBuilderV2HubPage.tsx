import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LabBuilderV2Frame } from '../components/LabBuilderV2Frame';
import { listSavedRecipes } from '../lib/lab-store';

const familyCards = [
  {
    key: 'beer',
    family: 'Beer',
    route: '/lab/builder-v2/beer',
    eyebrow: 'Brewhouse Track',
    description:
      'Use the beer-specific builder for mash, boil, hops, fermentation, and style-driven brewing targets.',
  },
  {
    key: 'cider',
    family: 'Cider',
    route: '/lab/builder-v2/cider',
    eyebrow: 'Production Track',
    description:
      'Use the cider-specific builder for juice and concentrate planning, sweetness targets, carbonation, and compliance.',
  },
  {
    key: 'wine',
    family: 'Wine',
    route: '/lab/builder-v2/wine',
    eyebrow: 'Cellar Track',
    description:
      'Use the wine-specific builder for must planning, acid and tannin structure, fermentation, stabilization, and label path.',
  },
];

export function LabBuilderV2HubPage() {
  const savedRecipes = useMemo(() => listSavedRecipes(), []);
  const familyCardsWithDrafts = familyCards.map((card) => {
    const draft = savedRecipes.find((recipe) => recipe.beverage === card.key);
    const abv = draft ? ((draft.targets.abv.min + draft.targets.abv.max) / 2).toFixed(2) : null;
    const ibu = draft ? ((draft.targets.ibu.min + draft.targets.ibu.max) / 2).toFixed(1) : null;
    const srm = draft ? ((draft.targets.srm.min + draft.targets.srm.max) / 2).toFixed(1) : null;
    return { ...card, draft, abv, ibu, srm };
  });

  return (
    <LabBuilderV2Frame
      title="LAB Builder V2"
      description="Separate product-family workspaces. Beer, cider, and wine now move toward dedicated solver and process logic."
      actions={
        <>
          <Link className="button" to="/lab/builder-v2/cider">
            Open Cider Builder
          </Link>
          <Link className="button button-muted" to="/lab/library">
            Library
          </Link>
          <Link className="button button-muted" to="/lab/builder">
            Legacy Builder
          </Link>
        </>
      }
    >
      <section className="lab-v2-family-grid">
        {familyCardsWithDrafts.map((card) => (
          <article key={card.family} className="card lab-v2-family-launch-card">
            <div className="lab-v2-family-launch-head">
              <span className="lab-v2-family-card-eyebrow">{card.eyebrow}</span>
              <span className="lab-v2-family-status">{card.draft ? 'Last Draft' : 'No Draft Yet'}</span>
            </div>
            <h2>{card.family} Builder</h2>
            <p>{card.description}</p>
            <div className="lab-v2-family-quicklook">
              <strong>{card.draft?.name ?? `No ${card.family.toLowerCase()} recipe started`}</strong>
              <span>
                {card.draft
                  ? `${card.draft.style_key || 'style pending'} · ${(card.draft.mode ?? 'hybrid').toUpperCase()}`
                  : 'Start here to build the next recipe in this family.'}
              </span>
            </div>
            <div className="lab-v2-family-mini-metrics">
              <div>
                <span>ABV</span>
                <strong>{card.abv ? `${card.abv}%` : 'n/a'}</strong>
              </div>
              <div>
                <span>{card.key === 'cider' ? 'FG' : 'IBU'}</span>
                <strong>
                  {card.draft
                    ? card.key === 'cider'
                      ? card.draft.targets.fg?.min?.toFixed(3) ?? 'n/a'
                      : card.ibu
                    : 'n/a'}
                </strong>
              </div>
              <div>
                <span>{card.key === 'wine' ? 'Batch' : card.key === 'cider' ? 'pH' : 'SRM'}</span>
                <strong>
                  {card.draft
                    ? card.key === 'wine'
                      ? `${card.draft.proposal.batch_size_l.toFixed(1)} L`
                      : card.key === 'cider'
                        ? card.draft.targets.ph?.min?.toFixed(2) ?? 'n/a'
                        : card.srm
                    : 'n/a'}
                </strong>
              </div>
            </div>
            <Link className="button" to={card.route}>
              {card.draft ? `Resume ${card.family}` : `Start ${card.family}`}
            </Link>
          </article>
        ))}
      </section>
    </LabBuilderV2Frame>
  );
}
