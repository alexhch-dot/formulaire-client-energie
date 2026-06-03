"use client";

import { FormEvent, useMemo, useState } from "react";

type FormErrors = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

type SubmitStatus =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function removeFrenchLeadingZero(digits: string) {
  return digits.startsWith("0") ? digits.slice(1) : digits;
}

function formatFrenchNationalNumber(digits: string) {
  const normalizedDigits = removeFrenchLeadingZero(digits).slice(0, 9);
  const groups = [normalizedDigits.slice(0, 1)];

  for (let index = 1; index < normalizedDigits.length; index += 2) {
    groups.push(normalizedDigits.slice(index, index + 2));
  }

  return groups.filter(Boolean).join(" ");
}

function formatFrenchInternationalNumber(digits: string) {
  const nationalNumber = formatFrenchNationalNumber(digits);
  return nationalNumber ? `+33 ${nationalNumber}` : "-";
}

export default function Home() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [celebrationCount, setCelebrationCount] = useState(0);

  const phoneDigits = useMemo(() => removeFrenchLeadingZero(onlyDigits(phone)), [phone]);
  const formattedPhone = useMemo(() => formatFrenchInternationalNumber(phoneDigits), [phoneDigits]);

  function resetStatus() {
    setStatus({ type: "idle", message: "" });
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!firstName.trim()) {
      nextErrors.firstName = "Le prénom est obligatoire.";
    }

    if (!lastName.trim()) {
      nextErrors.lastName = "Le nom est obligatoire.";
    }

    if (!phoneDigits) {
      nextErrors.phone = "Le numéro de téléphone est obligatoire.";
    } else if (phoneDigits.length !== 9) {
      nextErrors.phone = "Le numéro doit contenir 9 chiffres après +33.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handlePhoneChange(value: string) {
    setPhone(formatFrenchNationalNumber(onlyDigits(value)));
    resetStatus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetStatus();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/client-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          phone: formattedPhone,
          phoneDigits,
        }),
      });

      if (!response.ok) {
        setStatus({
          type: "error",
          message: "Impossible d'envoyer le client pour le moment.",
        });
        return;
      }

      setStatus({ type: "success", message: "Client envoyé à Make." });
      setCelebrationCount((currentCount) => currentCount + 1);
    } catch {
      setStatus({
        type: "error",
        message: "Impossible d'envoyer le client pour le moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      {celebrationCount > 0 ? (
        <div className="celebration-animation" key={celebrationCount} aria-hidden="true">
          <div className="celebration-badge">
            <span className="celebration-check">✓</span>
          </div>
          {Array.from({ length: 10 }, (_, index) => (
            <span className="confetti-dot" key={index} />
          ))}
        </div>
      ) : null}

      <section className="form-panel" aria-labelledby="form-title">
        <div className="panel-header">
          <p className="eyebrow">Rappel expert énergie</p>
          <h1 id="form-title">Créer une demande client</h1>
          <p className="intro">
            Renseignez les informations du client pour préparer le choix d'offre
            et le créneau de rappel.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-grid">
            <label className="field">
              <span>Nom</span>
              <input
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                  resetStatus();
                }}
                type="text"
                autoComplete="family-name"
                required
                placeholder="Durand"
              />
              <small className="error-message">{errors.lastName}</small>
            </label>

            <label className="field">
              <span>Prénom</span>
              <input
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  resetStatus();
                }}
                type="text"
                autoComplete="given-name"
                required
                placeholder="Camille"
              />
              <small className="error-message">{errors.firstName}</small>
            </label>
          </div>

          <label className="field">
            <span>Numéro de téléphone</span>
            <div className="phone-row">
              <span className="country-code">+33</span>
              <input
                value={phone}
                onChange={(event) => handlePhoneChange(event.target.value)}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                maxLength={14}
                placeholder="6 12 34 56 78"
                aria-describedby="phone-help phone-error"
              />
            </div>
            <small id="phone-help" className="help-text">
              France préselectionnée. Entrez uniquement les chiffres, sans le 0 initial si possible.
            </small>
            <small id="phone-error" className="error-message">
              {errors.phone}
            </small>
          </label>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Envoi en cours..." : "Envoyer à Make"}
          </button>
        </form>
      </section>

      <aside className="summary-panel" aria-labelledby="summary-title">
        <h2 id="summary-title">Aperçu client</h2>
        <dl>
          <div>
            <dt>Nom</dt>
            <dd>{lastName.trim() || "-"}</dd>
          </div>
          <div>
            <dt>Prénom</dt>
            <dd>{firstName.trim() || "-"}</dd>
          </div>
          <div>
            <dt>Téléphone</dt>
            <dd>{formattedPhone}</dd>
          </div>
        </dl>
        {status.message ? (
          <p className={`status-message ${status.type}`}>{status.message}</p>
        ) : null}
      </aside>
    </main>
  );
}
