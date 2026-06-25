import { useState, useRef, useCallback, useEffect } from "react";
import html2canvas from "html2canvas";
import { X, Download, RotateCw, Share2 } from "lucide-react";

const FRONT_BG =
  "https://res.cloudinary.com/dqndhcmu2/image/upload/v1773232516/vanigan/templates/ID_Front.png";
const BACK_BG =
  "https://res.cloudinary.com/dqndhcmu2/image/upload/v1773232519/vanigan/templates/ID_Back.png";

const SITE_URL = "https://vanigan.digital";
const CARD_W = 421;

/* ── Wait for every <img> inside el to finish loading ── */
function waitImages(el) {
  return new Promise((resolve) => {
    const imgs = Array.from(el.querySelectorAll("img"));
    if (!imgs.length) {
      resolve();
      return;
    }
    let pending = imgs.length;
    const done = () => {
      if (--pending === 0) resolve();
    };
    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        done();
        return;
      }
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
    setTimeout(resolve, 10000); // safety timeout
  });
}

export async function buildComboCanvas(frontEl, backEl) {
  const SCALE = 3; // 421*3=1263px per card — full quality

  await waitImages(frontEl);
  await waitImages(backEl);
  await new Promise((r) => setTimeout(r, 800)); // let fonts & images settle

  const opts = {
    scale: SCALE,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
  };

  const frontCanvas = await html2canvas(frontEl, opts);
  await new Promise((r) => setTimeout(r, 200));
  const backCanvas = await html2canvas(backEl, opts);

  // Combine side-by-side
  const gap = 60 * SCALE;
  const labelH = 24 * SCALE;
  const combo = document.createElement("canvas");
  combo.width = frontCanvas.width + gap + backCanvas.width;
  combo.height = Math.max(frontCanvas.height, backCanvas.height) + labelH;

  const ctx = combo.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, combo.width, combo.height);

  // Labels
  ctx.font = `bold ${16 * SCALE}px Arial, sans-serif`;
  ctx.fillStyle = "#333333";
  ctx.textAlign = "center";
  ctx.fillText("Front", frontCanvas.width / 2, 15 * SCALE);
  ctx.fillText(
    "Back",
    frontCanvas.width + gap + backCanvas.width / 2,
    15 * SCALE,
  );

  // Cards
  ctx.drawImage(frontCanvas, 0, labelH);
  ctx.drawImage(backCanvas, frontCanvas.width + gap, labelH);

  return combo;
}

/* ── CardFront component ── */
export function CardFront({ member, display = "interactive", flipped = false }) {
  const isCapture = display === "capture";

  if (isCapture) {
    return (
      <div
        style={{
          width: CARD_W,
          position: "relative",
          overflow: "hidden",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <img
          src={FRONT_BG}
          crossOrigin="anonymous"
          alt=""
          style={{ display: "block", width: CARD_W, height: "auto" }}
        />

        {/* Photo */}
        <div
          style={{
            position: "absolute",
            top: 182,
            left: "50%",
            transform: "translateX(-50%)",
            width: 137,
          }}
        >
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              crossOrigin="anonymous"
              alt={member.name}
              style={{
                display: "block",
                width: 137,
                height: 136,
                objectFit: "cover",
                borderRadius: 22,
              }}
            />
          ) : (
            <div
              style={{
                width: 137,
                height: 136,
                borderRadius: 22,
                background: "rgba(0,146,69,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 56,
                fontWeight: 700,
                color: "#009245",
              }}
            >
              {(member.name || "M").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        {/* Text stack */}
        <div
          style={{
            position: "absolute",
            top: 328,
            left: 28,
            right: 28,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 23,
              fontWeight: 700,
              color: "#009245",
              lineHeight: 1.08,
              wordBreak: "break-word",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {(member.name || "").toUpperCase()}
          </p>
          {member.isOrganizer ? (
            <>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 19,
                  fontWeight: 700,
                  color: "#111",
                  lineHeight: 1.06,
                  textTransform: "capitalize",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {member.bizCategory || "Organizer"}
              </p>
              {member.district && (
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#111",
                    lineHeight: 1.06,
                    textTransform: "capitalize",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {member.district}
                </p>
              )}
              {member.assemblyName && (
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#111",
                    lineHeight: 1.06,
                    textTransform: "capitalize",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {member.assemblyName}
                </p>
              )}
            </>
          ) : (
            <>
              {member.assemblyName && (
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#111",
                    lineHeight: "22px",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {member.assemblyName}{" "}
                  <span
                    style={{
                      display: "inline-block",
                      verticalAlign: "middle",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#fff",
                      background: "#009245",
                      borderRadius: 4,
                      padding: "2px 5px",
                      marginLeft: 4,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      fontFamily: "Arial, sans-serif",
                      lineHeight: "12px",
                    }}
                  >
                    Assm
                  </span>
                </p>
              )}
              {member.district && (
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#111",
                    lineHeight: "22px",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {member.district}{" "}
                  <span
                    style={{
                      display: "inline-block",
                      verticalAlign: "middle",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#fff",
                      background: "#009245",
                      borderRadius: 4,
                      padding: "2px 5px",
                      marginLeft: 4,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      fontFamily: "Arial, sans-serif",
                      lineHeight: "12px",
                    }}
                  >
                    Dist
                  </span>
                </p>
              )}
              {member.zone && (
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#111",
                    lineHeight: 1.06,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {member.zone}
                </p>
              )}
            </>
          )}
          <p
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "#111",
              letterSpacing: "0.2px",
              marginTop: 2,
              fontFamily: "Arial, sans-serif",
              lineHeight: 1.1,
            }}
          >
            {member.membershipId || "TNV-000000"}
          </p>
        </div>
      </div>
    );
  }

  // Interactive display (320×448)
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        borderRadius: 18,
        overflow: "hidden",
        backgroundImage: `url(${FRONT_BG})`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        transform: "rotateY(0deg)",
        opacity: flipped ? 0 : 1,
        visibility: flipped ? "hidden" : "visible",
        transition: "opacity 0s linear 0.3s, visibility 0s linear 0.3s",
      }}
    >
      {/* Photo */}
      <div
        style={{
          position: "absolute",
          top: "31%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 110,
          height: 110,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 16,
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 16,
              background: "rgba(0,146,69,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
              color: "#009245",
            }}
          >
            {(member.name || "M").slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      {/* Text block */}
      <div
        style={{
          position: "absolute",
          top: "57%",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 5,
          padding: "0 14px",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "Arial, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#009245",
            lineHeight: 1.1,
            textAlign: "center",
            wordBreak: "break-word",
          }}
        >
          {(member.name || "").toUpperCase()}
        </p>
        {member.isOrganizer ? (
          <>
            <p
              style={{
                margin: 0,
                fontFamily: "Arial, sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: "#111",
                textAlign: "center",
                textTransform: "capitalize",
              }}
            >
              {member.bizCategory || "Organizer"}
            </p>
            {member.district && (
              <p
                style={{
                  margin: 0,
                  fontFamily: "Arial, sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#111",
                  textAlign: "center",
                  textTransform: "capitalize",
                }}
              >
                {member.district}
              </p>
            )}
            {member.assemblyName && (
              <p
                style={{
                  margin: 0,
                  fontFamily: "Arial, sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#111",
                  textAlign: "center",
                  textTransform: "capitalize",
                }}
              >
                {member.assemblyName}
              </p>
            )}
          </>
        ) : (
          <>
            {member.assemblyName && (
              <p
                style={{
                  margin: 0,
                  fontFamily: "Arial, sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#111",
                  textAlign: "center",
                  lineHeight: "15px",
                }}
              >
                {member.assemblyName}{" "}
                <span
                  style={{
                    display: "inline-block",
                    verticalAlign: "middle",
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#fff",
                    background: "#009245",
                    borderRadius: 3,
                    padding: "1px 4px",
                    marginLeft: 2,
                    textTransform: "uppercase",
                    lineHeight: "10px",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  Assm
                </span>
              </p>
            )}
            {member.district && (
              <p
                style={{
                  margin: 0,
                  fontFamily: "Arial, sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#111",
                  textAlign: "center",
                  lineHeight: "15px",
                }}
              >
                {member.district}{" "}
                <span
                  style={{
                    display: "inline-block",
                    verticalAlign: "middle",
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#fff",
                    background: "#009245",
                    borderRadius: 3,
                    padding: "1px 4px",
                    marginLeft: 2,
                    textTransform: "uppercase",
                    lineHeight: "10px",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  Dist
                </span>
              </p>
            )}
            {member.zone && (
              <p
                style={{
                  margin: 0,
                  fontFamily: "Arial, sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#111",
                  textAlign: "center",
                }}
              >
                {member.zone}
              </p>
            )}
          </>
        )}
        <p
          style={{
            margin: 0,
            fontFamily: "Arial, sans-serif",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.3px",
            color: "#111",
            marginTop: 2,
          }}
        >
          {member.membershipId || "TNV-000000"}
        </p>
      </div>
    </div>
  );
}

/* ── CardBack component ── */
export function CardBack({ member, display = "interactive", flipped = false }) {
  const isCapture = display === "capture";
  const qrData = `${SITE_URL}?page=verify&id=${member.membershipId || "TNV-000000"}`;
  const qrSize = isCapture ? 96 : 90;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize * 3}x${qrSize * 3}&data=${encodeURIComponent(qrData)}`;

  const formatDob = (dob) => {
    if (!dob) return "—";
    if (dob.includes("/")) {
      const [d, m, y] = dob.split("/");
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      return `${d} ${months[parseInt(m, 10) - 1] || m} ${y}`;
    }
    try {
      return new Date(dob).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dob;
    }
  };

  const addressRaw = member.businessAddress || "—";
  const rowBase = {
    display: "grid",
    gridTemplateColumns: "46% 6% 48%",
    alignItems: "start",
    overflow: "hidden",
  };

  if (isCapture) {
    const rowBaseCapture = {
      display: "grid",
      gridTemplateColumns: "46% 6% 48%",
      alignItems: "center",
      overflow: "visible",
    };
    const rowAddressCapture = {
      ...rowBaseCapture,
      alignItems: "start",
    };

    return (
      <div
        style={{
          width: CARD_W,
          position: "relative",
          overflow: "hidden",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <img
          src={BACK_BG}
          crossOrigin="anonymous"
          alt=""
          style={{ display: "block", width: CARD_W, height: "auto" }}
        />

        <div style={{ position: "absolute", top: 174, left: 22, right: 20 }}>
          <div style={{ ...rowBaseCapture, height: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", color: "#111" }}>
              DATE OF BIRTH
            </div>
            <div style={{ fontSize: 17, lineHeight: 1.12, textAlign: "center", fontWeight: 700, color: "#111" }}>:</div>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.12, color: "#111" }}>
              {formatDob(member.dob)}
            </div>
          </div>

          <div style={{ ...rowBaseCapture, height: 24, marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", color: "#111" }}>
              AGE
            </div>
            <div style={{ fontSize: 17, lineHeight: 1.12, textAlign: "center", fontWeight: 700, color: "#111" }}>:</div>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.12, color: "#111" }}>
              {member.age || "—"}
            </div>
          </div>

          <div style={{ ...rowBaseCapture, height: 24, marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", color: "#111" }}>
              BLOOD GROUP
            </div>
            <div style={{ fontSize: 17, lineHeight: 1.12, textAlign: "center", fontWeight: 700, color: "#111" }}>:</div>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.12, color: "#111" }}>
              {member.bloodGroup || "—"}
            </div>
          </div>

          <div style={{ ...rowAddressCapture, height: 84, marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", color: "#111" }}>
              ADDRESS
            </div>
            <div style={{ fontSize: 17, lineHeight: 1.12, textAlign: "center", fontWeight: 700, color: "#111" }}>:</div>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.12, wordBreak: "break-word", color: "#111" }}>
              {addressRaw}
            </div>
          </div>

          <div style={{ ...rowBaseCapture, height: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", color: "#111" }}>
              CONTACT
            </div>
            <div style={{ fontSize: 17, lineHeight: 1.12, textAlign: "center", fontWeight: 700, color: "#111" }}>:</div>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.12, color: "#111" }}>
              <span style={{ background: "rgba(255,255,255,0.78)", display: "inline-block", padding: "0 4px" }}>
                {member.phone || "—"}
              </span>
            </div>
          </div>

          {/* QR + Signature */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginTop: 28,
              paddingLeft: 8,
              paddingRight: 8,
            }}
          >
            <div>
              <img
                src={qrUrl}
                crossOrigin="anonymous"
                width={qrSize}
                height={qrSize}
                alt="QR Code"
                style={{ display: "block" }}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <img
                src="/signature.png"
                crossOrigin="anonymous"
                alt="Signature"
                style={{
                  width: 80,
                  height: "auto",
                  display: "block",
                  margin: "0 auto 2px",
                }}
              />
              <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "#111", lineHeight: 1.2, textAlign: "center" }}>
                SENTHIL KUMAR N
              </p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#111", lineHeight: 1.15, textAlign: "center" }}>
                Founder &amp; State President
              </p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#111", lineHeight: 1.15, textAlign: "center" }}>
                Tamilnadu Vanigargalin Sangamam
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interactive display (320×448)
  const rowSingle = { ...rowBase, height: 20, marginBottom: 0 };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        borderRadius: 18,
        overflow: "hidden",
        backgroundImage: `url(${BACK_BG})`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        fontFamily: "Arial, Helvetica, sans-serif",
        opacity: flipped ? 1 : 0,
        visibility: flipped ? "visible" : "hidden",
        transition: "opacity 0s linear 0.3s, visibility 0s linear 0.3s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "29.5%",
          left: 22,
          right: 20,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <div>
          <div style={rowSingle}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#111" }}>
              DATE OF BIRTH
            </div>
            <div style={{ fontSize: 20, lineHeight: 0.65, textAlign: "center", fontWeight: 700, color: "#111" }}>:</div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.12, color: "#111" }}>
              {formatDob(member.dob)}
            </div>
          </div>
          <div style={rowSingle}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#111" }}>
              AGE
            </div>
            <div style={{ fontSize: 20, lineHeight: 0.65, textAlign: "center", fontWeight: 700, color: "#111" }}>:</div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.12, color: "#111" }}>
              {member.age || "—"}
            </div>
          </div>
          <div style={rowSingle}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#111" }}>
              BLOOD GROUP
            </div>
            <div style={{ fontSize: 20, lineHeight: 0.65, textAlign: "center", fontWeight: 700, color: "#111" }}>:</div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.12, color: "#111" }}>
              {member.bloodGroup || "—"}
            </div>
          </div>
          <div style={{ ...rowBase, height: 76, marginBottom: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#111" }}>
              ADDRESS
            </div>
            <div style={{ fontSize: 20, lineHeight: 0.65, textAlign: "center", fontWeight: 700, color: "#111" }}>:</div>
            <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.12, wordBreak: "break-word", color: "#111" }}>
              {addressRaw}
            </div>
          </div>
          <div style={rowSingle}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#111" }}>
              CONTACT
            </div>
            <div style={{ fontSize: 20, lineHeight: 0.65, textAlign: "center", fontWeight: 700, color: "#111" }}>:</div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.12, color: "#111" }}>
              <span style={{ background: "rgba(255,255,255,0.78)", display: "inline-block", padding: "0 4px" }}>
                {member.phone || "—"}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginTop: 22,
            paddingLeft: 6,
            paddingRight: 6,
          }}
        >
          <div>
            <img
              src={qrUrl}
              width={90}
              height={90}
              alt="QR Code"
              style={{ display: "block" }}
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <img
              src="/signature.png"
              alt="Signature"
              style={{
                width: 80,
                height: "auto",
                display: "block",
                margin: "0 auto 2px",
              }}
            />
            <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 700, color: "#111", lineHeight: 1.2, textAlign: "center" }}>
              SENTHIL KUMAR N
            </p>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "#111", lineHeight: 1.15, textAlign: "center" }}>
              Founder &amp; State President
            </p>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "#111", lineHeight: 1.15, textAlign: "center" }}>
              Tamilnadu Vanigargalin Sangamam
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main CardModal Component ── */
export default function CardModal({ member, onClose }) {
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");

  const frontRef = useRef(null);
  const backRef = useRef(null);

  const handleDownload = useCallback(async () => {
    if (!frontRef.current || !backRef.current) return;
    setLoading(true);
    setLoadMsg("Generating high-quality card...");
    try {
      const combo = await buildComboCanvas(frontRef.current, backRef.current);
      const uid = member.membershipId || "vanigan-card";
      const link = document.createElement("a");
      link.download = `${uid}_card.png`;
      link.href = combo.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Download failed: " + e.message);
    } finally {
      setLoading(false);
      setLoadMsg("");
    }
  }, [member]);

  const handleShare = useCallback(async () => {
    if (!frontRef.current || !backRef.current) return;
    setLoading(true);
    setLoadMsg("Preparing card for sharing...");
    try {
      const combo = await buildComboCanvas(frontRef.current, backRef.current);
      const uid = member.membershipId || "vanigan-card";
      
      const blob = await new Promise((resolve) => combo.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Failed to generate image blob");
      
      const file = new File([blob], `${uid}_card.png`, { type: "image/png" });
      const verifyUrl = `${SITE_URL}?page=verify&id=${member.membershipId || "TNV-000000"}`;
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file]
        });
      } else {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(verifyUrl)}`;
        window.open(whatsappUrl, "_blank");
        await navigator.clipboard.writeText(verifyUrl).catch(() => {});
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Share failed:", e);
        const verifyUrl = `${SITE_URL}?page=verify&id=${member.membershipId || "TNV-000000"}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(verifyUrl)}`;
        window.open(whatsappUrl, "_blank");
        navigator.clipboard.writeText(verifyUrl).catch(() => {});
      }
    } finally {
      setLoading(false);
      setLoadMsg("");
    }
  }, [member]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-black/85 flex flex-col items-center justify-center">
          <div className="animate-spin text-4xl mb-4 text-[#66ff4c]">⟳</div>
          <p className="text-white text-sm font-semibold">{loadMsg}</p>
        </div>
      )}

      {/* Hidden high-res capture clones */}
      <div style={{ position: "fixed", left: -9999, top: 0, pointerEvents: "none", zIndex: -1, opacity: 0 }}>
        <div ref={frontRef} style={{ width: 421, position: "relative", overflow: "hidden" }}>
          <CardFront member={member} display="capture" />
        </div>
        <div ref={backRef} style={{ width: 421, position: "relative", overflow: "hidden", marginTop: 20 }}>
          <CardBack member={member} display="capture" />
        </div>
      </div>

      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md md:max-w-2xl p-6 relative flex flex-col md:flex-row gap-8 items-center md:items-start shadow-2xl max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition z-10"
        >
          <X size={20} />
        </button>

        {/* Left Side: Card Frame & Flip Hint */}
        <div className="flex flex-col items-center select-none flex-shrink-0">
          <div
            onClick={() => setFlipped(!flipped)}
            style={{
              width: 320,
              height: 448,
              perspective: "1000px",
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
                transformStyle: "preserve-3d",
                WebkitTransformStyle: "preserve-3d",
                transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)",
                transform: `rotateY(${flipped ? 180 : 0}deg)`,
              }}
            >
              <CardFront member={member} flipped={flipped} />
              <CardBack member={member} flipped={flipped} />
            </div>
          </div>

          <p className="text-gray-400 text-xs text-center font-medium">
            {flipped ? "↩ Click card to see front" : "↩ Click card to flip & see back"}
          </p>
        </div>

        {/* Right Side: Title, Info & Action Buttons */}
        <div className="flex-1 flex flex-col justify-between w-full md:self-center space-y-6">
          <div>
            <h3 className="font-extrabold text-white text-xl tracking-tight text-center md:text-left">
              Card Preview
            </h3>
            <p className="text-gray-400 text-xs mt-1 font-semibold text-center md:text-left">
              Preview and verify member & organizer credentials.
            </p>
          </div>

          {/* Details Box */}
          <div className="bg-[#000]/30 border border-white/[0.04] rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Full Name</span>
              <span className="text-white font-bold">{member.name || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Card ID</span>
              <span className="text-white font-mono font-bold">{member.membershipId || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Designation / Role</span>
              <span className="text-[#66ff4c] font-bold">{member.bizCategory || 'Member'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">District / Wing</span>
              <span className="text-white font-bold">
                {[member.district, member.assemblyName].filter(Boolean).join(' / ') || '—'}
              </span>
            </div>
          </div>

          {/* Action Buttons Stack */}
          <div className="flex flex-col gap-2.5 w-full">
            <button
              onClick={() => setFlipped(!flipped)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition text-xs font-bold uppercase tracking-wider"
            >
              <RotateCw size={14} /> Flip Card
            </button>
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#66ff4c]/10 border border-[#66ff4c]/30 text-[#66ff4c] hover:bg-[#66ff4c]/20 transition text-xs font-bold uppercase tracking-wider"
            >
              <Download size={14} /> Download Card
            </button>
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition text-xs font-bold uppercase tracking-wider"
            >
              <Share2 size={14} /> Share Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
