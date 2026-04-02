import Link from "next/link";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  CalendarDays,
  Coins,
  ExternalLink,
  MapPin,
  QrCode,
  Shield,
  Sparkles,
  Video,
  Wallet
} from "lucide-react";
import { ListingActions } from "@/components/marketplace/ListingActions";
import { TraceTimeline } from "@/components/trace/TraceTimeline";
import { getMergedListingById, getMergedTrace } from "@/lib/contracts/read-models";
import styles from "./page.module.css";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatReadableDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function getHarvestNote(harvestDate: string) {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diffMs = Date.now() - new Date(harvestDate).getTime();
  const days = Math.max(0, Math.floor(diffMs / oneDayMs));

  if (days <= 1) {
    return "Freshly harvested";
  }

  if (days <= 3) {
    return `${days} days since harvest`;
  }

  return `${days} days from harvest window`;
}

function getStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function getQualityStory(qualityGrade: string) {
  if (qualityGrade === "A+") {
    return "Premium export-friendly lot with strong trust signals and shelf confidence.";
  }

  if (qualityGrade === "A") {
    return "High-confidence trade lot with strong quality and reliable buyer-readiness.";
  }

  if (qualityGrade === "B") {
    return "Commercial-grade produce suited for practical wholesale or fast-moving retail.";
  }

  return "Needs careful review, but the detail flow still keeps verification and traceability visible.";
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await getMergedListingById(params.id);

  if (!listing) {
    notFound();
  }

  const events = await getMergedTrace(listing.batchId);
  const totalValue = listing.quantityKg * listing.pricePerKg;
  const aiSuggestedPrice = listing.aiAnalysis?.suggestedPricePerKg ?? listing.pricePerKg;
  const aiDelta = aiSuggestedPrice - listing.pricePerKg;
  const traceUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/trace/${listing.batchId}`;
  const explorerBase = process.env.NEXT_PUBLIC_AMOY_EXPLORER_URL ?? "https://amoy.polygonscan.com";
  const verificationReady = Boolean(listing.liveRoomId);
  const onChainReady = Boolean(listing.onChainBatchId && listing.onChainTxHash);
  const trustHighlights = [
    {
      label: "Quality",
      value: listing.qualityGrade,
      meta: getQualityStory(listing.qualityGrade)
    },
    {
      label: "Harvest",
      value: getHarvestNote(listing.harvestDate),
      meta: formatReadableDate(listing.harvestDate)
    },
    {
      label: "Trade Value",
      value: formatCurrency(totalValue),
      meta: `${listing.quantityKg} kg ready for buyer review`
    }
  ];

  return (
    <main className={styles.page}>
      <section className={styles.heroShell}>
        <div className={styles.heroCard}>
          <div className={styles.mediaPane}>
            <div className={styles.mediaFrame}>
              <img src={listing.images[0]} alt={`${listing.crop} listing image`} className={styles.heroImage} />
              <div className={styles.mediaOverlay} />
              <div className={styles.mediaBadges}>
                <span className={styles.primaryBadge}>
                  <BadgeCheck size={14} />
                  {listing.verified ? "Verified Lot" : "Needs Review"}
                </span>
                <span className={styles.secondaryBadge}>{getStatusLabel(listing.status)}</span>
              </div>
              <div className={styles.mediaFooter}>
                <div className={styles.mediaMetric}>
                  <span>Asking price</span>
                  <strong>{formatCurrency(listing.pricePerKg)}/kg</strong>
                </div>
                <div className={styles.mediaMetric}>
                  <span>Available</span>
                  <strong>{listing.quantityKg} kg</strong>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.heroContent}>
            <div className={styles.utilityRow}>
              <Link href="/buyer" className={styles.backLink}>
                <ArrowLeft size={16} />
                Back to Marketplace
              </Link>
              <div className={styles.utilityBadges}>
                <span className={styles.utilityChip}>
                  <MapPin size={14} />
                  {listing.location}
                </span>
                <span className={styles.utilityChip}>
                  <Shield size={14} />
                  Trust {listing.trustScore}
                </span>
              </div>
            </div>

            <div className={styles.titleBlock}>
              <p className={styles.kicker}>Buyer-ready crop profile</p>
              <h1 className={styles.title}>{listing.crop}</h1>
              <p className={styles.lead}>{listing.description}</p>
            </div>

            <div className={styles.metricGrid}>
              <article className={styles.metricCard}>
                <span>Fair trade price</span>
                <strong>{formatCurrency(listing.pricePerKg)}</strong>
                <small>Per kilogram</small>
              </article>
              <article className={styles.metricCard}>
                <span>Total lot value</span>
                <strong>{formatCompactCurrency(totalValue)}</strong>
                <small>{formatCurrency(totalValue)} full batch</small>
              </article>
              <article className={styles.metricCard}>
                <span>Quality score</span>
                <strong>{listing.qualityGrade}</strong>
                <small>{listing.verified ? "AI and verification flow ready" : "Awaiting stronger signals"}</small>
              </article>
              <article className={styles.metricCard}>
                <span>Blockchain state</span>
                <strong>{listing.onChainBatchId ? `#${listing.onChainBatchId}` : "Local"}</strong>
                <small>{listing.onChainBatchId ? "Polygon Amoy linked" : "Demo-only listing"}</small>
              </article>
            </div>

            <div className={styles.actionRow}>
              <Link href={`/call/${listing.liveRoomId ?? `room-${listing.id}`}`} className={styles.primaryAction}>
                <Video size={18} />
                Open Verification Room
              </Link>
              <Link href={`/trace/${listing.batchId}`} className={styles.secondaryAction}>
                <QrCode size={18} />
                View Public Trace
              </Link>
              {listing.onChainTxHash ? (
                <a
                  href={`${explorerBase}/tx/${listing.onChainTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.secondaryAction}
                >
                  <ExternalLink size={18} />
                  View Chain Proof
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <section className={styles.spotlightPanel}>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.sectionKicker}>Why this lot stands out</p>
                <h2 className={styles.sectionTitle}>High-signal buyer snapshot</h2>
              </div>
              <div className={styles.sectionTag}>Ready for negotiation</div>
            </div>

            <div className={styles.highlightGrid}>
              {trustHighlights.map((item) => (
                <article key={item.label} className={styles.highlightCard}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.meta}</p>
                </article>
              ))}
            </div>

            <div className={styles.readinessBand}>
              <div className={styles.readinessItem}>
                <Sparkles size={18} />
                <div>
                  <strong>AI trade guidance</strong>
                  <span>
                    {aiDelta === 0
                      ? "Current price is aligned with the AI suggestion."
                      : aiDelta > 0
                        ? `${formatCurrency(aiDelta)} above AI suggestion, signaling a premium lot narrative.`
                        : `${formatCurrency(Math.abs(aiDelta))} below AI suggestion, creating a value-buy signal.`}
                  </span>
                </div>
              </div>
              <div className={styles.readinessItem}>
                <Video size={18} />
                <div>
                  <strong>Live verification</strong>
                  <span>{verificationReady ? "Room is ready for farmer-buyer inspection." : "Verification room will be created when needed."}</span>
                </div>
              </div>
              <div className={styles.readinessItem}>
                <Shield size={18} />
                <div>
                  <strong>Escrow and trace</strong>
                  <span>{onChainReady ? "Listing already carries on-chain proof for transparent trade." : "Escrow and trace flow stay available from this page."}</span>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.detailPanel}>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.sectionKicker}>Batch intelligence</p>
                <h2 className={styles.sectionTitle}>Everything a buyer needs before committing</h2>
              </div>
            </div>

            <div className={styles.detailSplit}>
              <div className={styles.infoBlock}>
                <h3 className={styles.blockTitle}>Lot details</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCard}>
                    <span>Batch ID</span>
                    <strong>{listing.batchId}</strong>
                  </div>
                  <div className={styles.infoCard}>
                    <span>Harvest date</span>
                    <strong>{formatReadableDate(listing.harvestDate)}</strong>
                  </div>
                  <div className={styles.infoCard}>
                    <span>Farmer</span>
                    <strong>{listing.farmerName}</strong>
                  </div>
                  <div className={styles.infoCard}>
                    <span>Origin</span>
                    <strong>{listing.location}</strong>
                  </div>
                  <div className={styles.infoCard}>
                    <span>Wallet</span>
                    <strong className={styles.monoText}>{listing.farmerWallet}</strong>
                  </div>
                  <div className={styles.infoCard}>
                    <span>On-chain batch</span>
                    <strong>{listing.onChainBatchId ? `#${listing.onChainBatchId}` : "Not minted yet"}</strong>
                  </div>
                </div>
              </div>

              <div className={`${styles.infoBlock} ${styles.aiShell}`}>
                <div className={styles.aiHeader}>
                  <div>
                    <h3 className={styles.blockTitle}>AI quality brief</h3>
                    <p className={styles.blockCopy}>A compact view of disease detection, freshness, and pricing guidance.</p>
                  </div>
                  <div className={styles.aiBadge}>
                    <Sparkles size={14} />
                    Smart analysis
                  </div>
                </div>

                {listing.aiAnalysis ? (
                  <>
                    <div className={styles.aiStats}>
                      <div className={styles.aiStat}>
                        <span>Disease signal</span>
                        <strong>{listing.aiAnalysis.disease}</strong>
                      </div>
                      <div className={styles.aiStat}>
                        <span>Confidence</span>
                        <strong>{(listing.aiAnalysis.confidence * 100).toFixed(1)}%</strong>
                      </div>
                      <div className={styles.aiStat}>
                        <span>Freshness</span>
                        <strong>{(listing.aiAnalysis.freshness * 100).toFixed(1)}%</strong>
                      </div>
                      <div className={styles.aiStat}>
                        <span>Suggested price</span>
                        <strong>{formatCurrency(listing.aiAnalysis.suggestedPricePerKg)}/kg</strong>
                      </div>
                    </div>
                    <div className={styles.recommendationList}>
                      {listing.aiAnalysis.recommendations.map((recommendation) => (
                        <div key={recommendation} className={styles.recommendationItem}>
                          <BadgeCheck size={16} />
                          <span>{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <Sparkles size={18} />
                    <span>No AI report is attached yet. Use the action panel to generate one from this page.</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className={`${styles.detailPanel} ${styles.timelineShell}`}>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.sectionKicker}>Trust timeline</p>
                <h2 className={styles.sectionTitle}>Proof, checkpoints, and market movement</h2>
              </div>
              <div className={styles.sectionTag}>{events.length} events</div>
            </div>
            <TraceTimeline events={events} />
          </section>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.actionShell}>
            <ListingActions listing={listing} />
          </div>

          <section className={styles.sidePanel}>
            <div className={styles.sideHeader}>
              <div>
                <p className={styles.sectionKicker}>Proof kit</p>
                <h3 className={styles.sideTitle}>Shareable trust package</h3>
              </div>
              <div className={styles.iconChip}>
                <QrCode size={16} />
              </div>
            </div>

            <div className={styles.qrFrame}>
              <QRCodeSVG value={traceUrl} size={176} />
            </div>

            <div className={styles.sideList}>
              <div className={styles.sideListRow}>
                <span>Trace link</span>
                <strong>Public page ready</strong>
              </div>
              <div className={styles.sideListRow}>
                <span>Verification room</span>
                <strong>{verificationReady ? "Live room available" : "Room on demand"}</strong>
              </div>
              <div className={styles.sideListRow}>
                <span>Escrow flow</span>
                <strong>{listing.onChainBatchId ? "Blockchain-enabled" : "Demo fallback"}</strong>
              </div>
            </div>

            <div className={styles.sideActionStack}>
              <Link href={`/trace/${listing.batchId}`} className={styles.secondaryActionWide}>
                <Boxes size={18} />
                Open Public Trace
              </Link>
              <Link href={`/call/${listing.liveRoomId ?? `room-${listing.id}`}`} className={styles.secondaryActionWide}>
                <Video size={18} />
                Start Verification Call
              </Link>
            </div>
          </section>

          <section className={styles.sidePanel}>
            <div className={styles.sideHeader}>
              <div>
                <p className={styles.sectionKicker}>Trade identity</p>
                <h3 className={styles.sideTitle}>Farmer and listing credibility</h3>
              </div>
              <div className={styles.iconChip}>
                <Shield size={16} />
              </div>
            </div>

            <div className={styles.identityCard}>
              <div className={styles.avatar}>{listing.farmerName.charAt(0).toUpperCase()}</div>
              <div>
                <strong>{listing.farmerName}</strong>
                <p>{listing.location}</p>
              </div>
            </div>

            <div className={styles.signalStack}>
              <div className={styles.signalRow}>
                <CalendarDays size={16} />
                <div>
                  <strong>{formatReadableDate(listing.harvestDate)}</strong>
                  <span>{getHarvestNote(listing.harvestDate)}</span>
                </div>
              </div>
              <div className={styles.signalRow}>
                <Coins size={16} />
                <div>
                  <strong>{formatCurrency(totalValue)}</strong>
                  <span>Indicative full-batch trade value</span>
                </div>
              </div>
              <div className={styles.signalRow}>
                <Wallet size={16} />
                <div>
                  <strong>{listing.onChainTxHash ? "Chain proof available" : "Awaiting chain proof"}</strong>
                  <span>{listing.onChainTxHash ? "Explorer link visible from this page." : "Listing still works without changing the flow."}</span>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
