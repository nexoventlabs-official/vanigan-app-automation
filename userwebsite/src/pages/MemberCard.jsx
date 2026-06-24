import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { useAuth } from "../context/AuthContext.jsx";
import { useNav } from "../App.jsx";

const FRONT_BG =
  "https://res.cloudinary.com/dqndhcmu2/image/upload/v1773232516/vanigan/templates/ID_Front.png";
const BACK_BG =
  "https://res.cloudinary.com/dqndhcmu2/image/upload/v1773232519/vanigan/templates/ID_Back.png";

// User website base URL — set VITE_USER_WEBSITE_URL in .env, falls back to current origin
const SITE_URL = (
  import.meta.env.VITE_USER_WEBSITE_URL || window.location.origin
).replace(/\/+$/, "");

/*
  Card dimensions — exact TNVS values:
  width: 421px, photo at top:182px, text stack at top:328px
  Card height is natural from the background image (~590px)
*/
const CARD_W = 421;

/* ─────────────────────────────────────────────────────────
   CardFront — interactive (320×480) and capture (421×auto)
───────────────────────────────────────────────────────── */
function CardFront({ member, display = "interactive", flipped = false }) {
  const isCapture = display === "capture";

  if (isCapture) {
    // Capture clone — exact TNVS pixel positions, width=421, height from bg img
    return (
      <div
        style={{
          width: CARD_W,
          position: "relative",
          overflow: "hidden",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Background img sets the natural height */}
        <img
          src={FRONT_BG}
          crossOrigin="anonymous"
          alt=""
          style={{ display: "block", width: CARD_W, height: "auto" }}
        />

        {/* Photo — top:182px, width:137px, height:136px — exact TNVS values */}
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

        {/* Text stack — top:328px, left/right:28px — exact TNVS values */}
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
            }}
          >
            {(member.name || "").toUpperCase()}
          </p>
          {member.isOrganizer ? (
            <>
              {/* Position/Role */}
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 19,
                  fontWeight: 700,
                  color: "#111",
                  lineHeight: 1.06,
                  textTransform: "capitalize",
                }}
              >
                {member.bizCategory || "Organizer"}
              </p>
              {/* State/District */}
              {member.district && (
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#111",
                    lineHeight: 1.06,
                    textTransform: "capitalize",
                  }}
                >
                  {member.district}
                </p>
              )}
              {/* Wing/Assembly */}
              {member.assemblyName && (
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#111",
                    lineHeight: 1.06,
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
                    margin: "0 0 6px",
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#111",
                    lineHeight: 1.06,
                  }}
                >
                  {member.assemblyName}{" "}
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#fff",
                      background: "#009245",
                      borderRadius: 4,
                      padding: "1px 5px",
                      marginLeft: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      lineHeight: 1.4,
                      verticalAlign: "middle",
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
                    lineHeight: 1.06,
                  }}
                >
                  {member.district}{" "}
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#fff",
                      background: "#009245",
                      borderRadius: 4,
                      padding: "1px 5px",
                      marginLeft: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      lineHeight: 1.4,
                      verticalAlign: "middle",
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
            }}
          >
            {member.membershipId || "TNV-000000"}
          </p>
        </div>
      </div>
    );
  }

  // Interactive display (320×480, percentage-based positions)
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
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
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
                }}
              >
                {member.assemblyName}{" "}
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#fff",
                    background: "#009245",
                    borderRadius: 3,
                    padding: "1px 4px",
                    marginLeft: 2,
                    textTransform: "uppercase",
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
                }}
              >
                {member.district}{" "}
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#fff",
                    background: "#009245",
                    borderRadius: 3,
                    padding: "1px 4px",
                    marginLeft: 2,
                    textTransform: "uppercase",
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

/* ─────────────────────────────────────────────────────────
   CardBack — interactive (320×480) and capture (421×auto)
───────────────────────────────────────────────────────── */
function CardBack({ member, display = "interactive", flipped = false }) {
  const isCapture = display === "capture";

  // QR encodes the verify-card URL so scanning opens the PIN-gated card view
  const qrData = `${SITE_URL}?page=verify&id=${member.membershipId || "TNV-000000"}`;
  // QR size: 96px for capture (matches TNVS), 90px for interactive
  const qrSize = isCapture ? 96 : 90;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize * 3}x${qrSize * 3}&data=${encodeURIComponent(qrData)}`;

  const formatDob = (dob) => {
    if (!dob) return "—";
    if (dob.includes("/")) {
      const [d, m, y] = dob.split("/");
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
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

  if (isCapture) {
    // Capture clone — exact TNVS pixel positions for back card
    // back-content: top:234px, left:22px, right:20px
    // back-details: translateY(-60px) → effective top = 234-60 = 174px
    const rowBase = {
      display: "grid",
      gridTemplateColumns: "46% 6% 48%",
      alignItems: "start",
      overflow: "hidden",
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
        {/* Background img sets natural height */}
        <img
          src={BACK_BG}
          crossOrigin="anonymous"
          alt=""
          style={{ display: "block", width: CARD_W, height: "auto" }}
        />

        {/* Details — top:174px (234-60), left:22px, right:20px — exact TNVS */}
        <div style={{ position: "absolute", top: 174, left: 22, right: 20 }}>
          <div style={{ ...rowBase, height: 20 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              DATE OF BIRTH
            </div>
            <div
              style={{
                fontSize: 26,
                lineHeight: 0.7,
                textAlign: "center",
                fontWeight: 700,
                color: "#111",
              }}
            >
              :
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                lineHeight: 1.12,
                color: "#111",
              }}
            >
              {formatDob(member.dob)}
            </div>
          </div>

          <div style={{ ...rowBase, height: 20, marginBottom: 10 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              AGE
            </div>
            <div
              style={{
                fontSize: 26,
                lineHeight: 0.7,
                textAlign: "center",
                fontWeight: 700,
                color: "#111",
              }}
            >
              :
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                lineHeight: 1.12,
                color: "#111",
              }}
            >
              {member.age || "—"}
            </div>
          </div>

          <div style={{ ...rowBase, height: 20, marginBottom: 10 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              BLOOD GROUP
            </div>
            <div
              style={{
                fontSize: 26,
                lineHeight: 0.7,
                textAlign: "center",
                fontWeight: 700,
                color: "#111",
              }}
            >
              :
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                lineHeight: 1.12,
                color: "#111",
              }}
            >
              {member.bloodGroup || "—"}
            </div>
          </div>

          {/* ADDRESS — fixed height 76px keeps gap consistent */}
          <div style={{ ...rowBase, height: 76, marginBottom: 10 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              ADDRESS
            </div>
            <div
              style={{
                fontSize: 26,
                lineHeight: 0.7,
                textAlign: "center",
                fontWeight: 700,
                color: "#111",
              }}
            >
              :
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.12,
                wordBreak: "break-word",
                color: "#111",
              }}
            >
              {addressRaw}
            </div>
          </div>

          <div style={{ ...rowBase, height: 20 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              CONTACT
            </div>
            <div
              style={{
                fontSize: 26,
                lineHeight: 0.7,
                textAlign: "center",
                fontWeight: 700,
                color: "#111",
              }}
            >
              :
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                lineHeight: 1.12,
                color: "#111",
              }}
            >
              <span
                style={{
                  background: "rgba(255,255,255,0.78)",
                  display: "inline-block",
                  padding: "0 4px",
                }}
              >
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
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111",
                  lineHeight: 1.2,
                  textAlign: "center",
                }}
              >
                SENTHIL KUMAR N
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#111",
                  lineHeight: 1.15,
                  textAlign: "center",
                }}
              >
                Founder &amp; State President
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#111",
                  lineHeight: 1.15,
                  textAlign: "center",
                }}
              >
                Tamilnadu Vanigargalin Sangamam
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interactive display (320×480)
  const rowBase = {
    display: "grid",
    gridTemplateColumns: "46% 6% 48%",
    alignItems: "start",
    overflow: "hidden",
  };
  const rowSingle = { ...rowBase, height: 20, marginBottom: 0 };
  const rowAddress = { ...rowBase, height: 76, marginBottom: 0 };

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
        boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
        fontFamily: "Arial, Helvetica, sans-serif",
        opacity: flipped ? 1 : 0,
        visibility: flipped ? "visible" : "hidden",
        transition: "opacity 0s linear 0.3s, visibility 0s linear 0.3s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: 22,
          right: 20,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <div>
          <div style={rowSingle}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              DATE OF BIRTH
            </div>
            <div
              style={{
                fontSize: 20,
                lineHeight: 0.65,
                textAlign: "center",
                fontWeight: 700,
                color: "#111",
              }}
            >
              :
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.12,
                color: "#111",
              }}
            >
              {formatDob(member.dob)}
            </div>
          </div>
          <div style={rowSingle}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              AGE
            </div>
            <div
              style={{
                fontSize: 20,
                lineHeight: 0.65,
                textAlign: "center",
                fontWeight: 700,
                color: "#111",
              }}
            >
              :
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.12,
                color: "#111",
              }}
            >
              {member.age || "—"}
            </div>
          </div>
          <div style={rowSingle}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              BLOOD GROUP
            </div>
            <div
              style={{
                fontSize: 20,
                lineHeight: 0.65,
                textAlign: "center",
                fontWeight: 700,
                color: "#111",
              }}
            >
              :
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.12,
                color: "#111",
              }}
            >
              {member.bloodGroup || "—"}
            </div>
          </div>
          <div style={rowAddress}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              ADDRESS
            </div>
            <div
              style={{
                fontSize: 20,
                lineHeight: 0.65,
                textAlign: "center",
                fontWeight: 700,
                color: "#111",
              }}
            >
              :
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1.12,
                wordBreak: "break-word",
                color: "#111",
              }}
            >
              {addressRaw}
            </div>
          </div>
          <div style={{ ...rowSingle, marginTop: 4 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#111",
              }}
            >
              CONTACT
            </div>
            <div
              style={{
                fontSize: 20,
                lineHeight: 0.65,
                textAlign: "center",
                fontWeight: 700,
                color: "#111",
              }}
            >
              :
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.12,
                color: "#111",
              }}
            >
              <span
                style={{
                  background: "rgba(255,255,255,0.78)",
                  display: "inline-block",
                  padding: "0 4px",
                }}
              >
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
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 11,
                fontWeight: 700,
                color: "#111",
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              SENTHIL KUMAR N
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 9,
                fontWeight: 700,
                color: "#111",
                lineHeight: 1.15,
                textAlign: "center",
              }}
            >
              Founder &amp; State President
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 9,
                fontWeight: 700,
                color: "#111",
                lineHeight: 1.15,
                textAlign: "center",
              }}
            >
              Tamilnadu Vanigargalin Sangamam
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wait for every <img> inside el to finish loading
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

async function buildComboCanvas(frontEl, backEl) {
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

  // Combine side-by-side (same as TNVS downloadCard('both'))
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

/* ─────────────────────────────────────────────────────────
   Card3D — interactive flip card + buttons
───────────────────────────────────────────────────────── */
export function Card3D({ member }) {
  const [flipped, setFlipped] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");

  const cardRef = useRef(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setRotateX(-dy * 12);
    setRotateY(dx * 12);
  };
  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const handleTouchStart = (e) => {
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setDragging(true);
  };
  const handleTouchMove = (e) => {
    if (!dragging) return;
    const dx = (e.touches[0].clientX - lastPos.current.x) * 0.3;
    const dy = (e.touches[0].clientY - lastPos.current.y) * 0.3;
    setRotateY((v) => Math.max(-30, Math.min(30, v + dx)));
    setRotateX((v) => Math.max(-20, Math.min(20, v - dy)));
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = () => {
    setDragging(false);
    setRotateX(0);
    setRotateY(0);
  };

  /* Download — high-quality PNG, both sides side-by-side */
  const handleDownload = useCallback(async () => {
    if (!frontRef.current || !backRef.current) return;
    setLoading(true);
    setLoadMsg("Generating high-quality card…");
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
    }
    setLoading(false);
    setLoadMsg("");
  }, [member]);

  /* Share — Web Share API with file, fallback to download */
  const handleShare = useCallback(async () => {
    if (!frontRef.current || !backRef.current) return;
    setLoading(true);
    setLoadMsg("Preparing to share…");
    try {
      const combo = await buildComboCanvas(frontRef.current, backRef.current);
      const uid = member.membershipId || "vanigan-card";
      if (navigator.canShare) {
        const blob = await new Promise((res) =>
          combo.toBlob(res, "image/png", 1.0),
        );
        const file = new File([blob], `${uid}_card.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          const referralUrl = `${SITE_URL}?ref=${uid}`;
          await navigator.share({
            title: "Vanigan Membership Card",
            text: `I'm a Vanigan member! 🪪\nMembership ID: ${uid}\nJoin using my link: ${referralUrl}`,
            files: [file],
          });
          setLoading(false);
          setLoadMsg("");
          return;
        }
      }
      // Fallback — download
      const link = document.createElement("a");
      link.download = `${uid}_card.png`;
      link.href = combo.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      if (e.name !== "AbortError") alert("Share failed: " + e.message);
    }
    setLoading(false);
    setLoadMsg("");
  }, [member]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      {/* Loading overlay */}
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.85)",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            style={{
              fontSize: 40,
              marginBottom: 14,
              display: "inline-block",
              animation: "kspin 1s linear infinite",
            }}
          >
            ⟳
          </div>
          <p
            style={{
              color: "#fff",
              fontFamily: "Arial, sans-serif",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {loadMsg}
          </p>
          <style>{`@keyframes kspin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/*
        Hidden high-res clones for html2canvas capture.
        421×590 = TNVS native card size.
        Using <img> tags for backgrounds (not CSS backgroundImage)
        so html2canvas captures them at full resolution.
      */}
      <div
        style={{
          position: "fixed",
          left: -9999,
          top: 0,
          pointerEvents: "none",
          zIndex: -1,
          opacity: 0,
        }}
      >
        <div
          ref={frontRef}
          style={{ width: 421, position: "relative", overflow: "hidden" }}
        >
          <CardFront member={member} display="capture" />
        </div>
        <div
          ref={backRef}
          style={{
            width: 421,
            position: "relative",
            overflow: "hidden",
            marginTop: 20,
          }}
        >
          <CardBack member={member} display="capture" />
        </div>
      </div>

      {/* Interactive 3D card (display size 320×480) */}
      <div
        ref={cardRef}
        style={{
          width: 320,
          height: 480,
          perspective: "1000px",
          cursor: "pointer",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            WebkitTransformStyle: "preserve-3d",
            transition: dragging
              ? "none"
              : "transform 0.6s cubic-bezier(0.4,0,0.2,1)",
            transform: `rotateX(${rotateX}deg) rotateY(${flipped ? 180 + rotateY : rotateY}deg)`,
          }}
        >
          <CardFront member={member} flipped={flipped} />
          <CardBack member={member} flipped={flipped} />
        </div>
      </div>

      {/* Flip hint */}
      <p
        style={{
          fontFamily: "var(--font-pp-neue-montreal)",
          fontSize: "12px",
          color: "var(--color-cool-gray)",
          textAlign: "center",
          margin: 0,
        }}
      >
        {flipped
          ? "↩ Click card to see front"
          : "↩ Click card to flip & see back"}
      </p>

      {/* Membership ID badge */}
      <div
        style={{
          background: "var(--color-mint-green-glow)",
          border: "2px solid var(--color-deep-fern-green)",
          borderRadius: 12,
          padding: "12px 24px",
          textAlign: "center",
          fontFamily: "var(--font-pp-neue-montreal)",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--color-cool-gray)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 4,
          }}
        >
          Membership ID
        </div>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "var(--color-deep-fern-green)",
            letterSpacing: "0.05em",
          }}
        >
          {member.membershipId || "TNV-000000"}
        </div>
      </div>

      {/* Download & Share buttons */}
      <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 320 }}>
        <button
          onClick={handleDownload}
          disabled={loading}
          style={{
            flex: 1,
            height: 46,
            borderRadius: 12,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg, #009245 0%, #006d34 100%)",
            color: "#fff",
            fontFamily: "var(--font-pp-neue-montreal)",
            fontSize: "14px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 4px 14px rgba(0,146,69,0.35)",
          }}
        >
          ⬇ Download Card
        </button>
        <button
          onClick={handleShare}
          disabled={loading}
          style={{
            flex: 1,
            height: 46,
            borderRadius: 12,
            cursor: loading ? "not-allowed" : "pointer",
            background: "#fff",
            color: "#009245",
            border: "2px solid #009245",
            fontFamily: "var(--font-pp-neue-montreal)",
            fontSize: "14px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: loading ? 0.7 : 1,
          }}
        >
          ↑ Share Card
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────── */
export default function MemberCard() {
  const { member, isLoggedIn } = useAuth();
  const { navigate } = useNav();

  if (!isLoggedIn || !member) {
    return (
      <div
        className="container section"
        style={{ maxWidth: 480, textAlign: "center" }}
      >
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🪪</div>
        <h1
          style={{
            fontFamily: "var(--font-pp-neue-montreal)",
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--color-rich-black)",
            marginBottom: 12,
          }}
        >
          Membership Card
        </h1>
        <p
          style={{
            fontFamily: "var(--font-pp-neue-montreal)",
            fontSize: "14px",
            color: "var(--color-cool-gray)",
            marginBottom: 24,
          }}
        >
          Please log in to view your membership card.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => navigate("login")}
            className="btn btn-primary btn-full"
            style={{ height: 44, borderRadius: 12 }}
          >
            Login
          </button>
          <button
            onClick={() => navigate("signup")}
            className="btn btn-outline btn-full"
            style={{ height: 44, borderRadius: 12 }}
          >
            Sign Up & Get Your Card
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section" style={{ maxWidth: 480 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <button className="btn-back" onClick={() => navigate("home")}>
          <svg
            height="16"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            viewBox="0 0 1024 1024"
          >
            <path d="M874.690416 495.52477c0 11.2973-9.168824 20.466124-20.466124 20.466124l-604.773963 0 188.083679 188.083679c7.992021 7.992021 7.992021 20.947078 0 28.939099-4.001127 3.990894-9.240455 5.996574-14.46955 5.996574-5.239328 0-10.478655-1.995447-14.479783-5.996574l-223.00912-223.00912c-3.837398-3.837398-5.996574-9.046027-5.996574-14.46955 0-5.433756 2.159176-10.632151 5.996574-14.46955l223.019353-223.029586c7.992021-7.992021 20.957311-7.992021 28.949332 0 7.992021 8.002254 7.992021 20.957311 0 28.949332l-188.073446 188.073446 604.753497 0C865.521592 475.058646 874.690416 484.217237 874.690416 495.52477z"></path>
          </svg>
          <span>Home</span>
        </button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-pp-neue-montreal)",
            fontSize: "26px",
            fontWeight: 700,
            color: "var(--color-rich-black)",
            marginBottom: 6,
          }}
        >
          {member.isOrganizer ? "My Organizer Card" : "My Membership Card"}
        </h1>
        <p
          style={{
            fontFamily: "var(--font-pp-neue-montreal)",
            color: "var(--color-cool-gray)",
            fontSize: "13px",
            margin: 0,
          }}
        >
          Tamilnadu Vanigargalin Sangamam
        </p>
      </div>

      <Card3D member={member} />

      {/* Member info summary */}
      <div
        style={{
          marginTop: 28,
          background: "var(--color-canvas-white)",
          border: "1px solid var(--color-subtle-ash)",
          borderRadius: 12,
          padding: 20,
          fontFamily: "var(--font-pp-neue-montreal)",
        }}
      >
        <h3
          style={{
            fontSize: "13px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--color-cool-gray)",
            marginBottom: 16,
          }}
        >
          {member.isOrganizer ? "Organizer Details" : "Member Details"}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 20px",
          }}
        >
          {[
            { label: "Name", value: member.name },
            { label: "Phone", value: member.phone },
            { label: "District", value: member.district },
            member.isOrganizer
              ? { label: "Role / Position", value: member.bizCategory }
              : null,
            { label: member.isOrganizer ? "Wing" : "Assembly", value: member.assemblyName },
            !member.isOrganizer ? { label: "Zone", value: member.zone } : null,
            { label: "Blood", value: member.bloodGroup },
            { label: "EPIC No.", value: member.epicNo || "—" },
            { label: "DOB", value: member.dob || "—" },
          ]
            .filter((r) => r && r.value)
            .map(({ label, value }) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--color-cool-gray)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-rich-black)",
                    wordBreak: "break-word",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
        </div>
      </div>

      <p
        style={{
          textAlign: "center",
          marginTop: 20,
          fontFamily: "var(--font-pp-neue-montreal)",
          fontSize: "12px",
          color: "var(--color-cool-gray)",
          lineHeight: 1.5,
        }}
      >
        💡 Use Download Card for a high-quality image of both sides.
      </p>
    </div>
  );
}
