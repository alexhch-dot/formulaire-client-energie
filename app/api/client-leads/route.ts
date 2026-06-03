import { NextResponse } from "next/server";

type ClientLeadRequest = {
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  phoneDigits?: unknown;
};

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

function buildPhoneValues(phone: unknown, phoneDigits: unknown) {
  const rawPhone = typeof phone === "string" ? phone : "";
  const rawDigits = typeof phoneDigits === "string" ? phoneDigits : "";
  const digits = removeFrenchLeadingZero(onlyDigits(rawDigits || rawPhone));

  return {
    phone: digits ? `+33 ${formatFrenchNationalNumber(digits)}` : "",
    phoneDigits: digits,
  };
}

export async function POST(request: Request) {
  let body: ClientLeadRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON invalide." }, { status: 400 });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const phoneValues = buildPhoneValues(body.phone, body.phoneDigits);

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Le nom et le prénom sont obligatoires." }, { status: 400 });
  }

  if (phoneValues.phoneDigits.length !== 9) {
    return NextResponse.json(
      { error: "Le téléphone doit contenir 9 chiffres après +33." },
      { status: 400 },
    );
  }

  const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!makeWebhookUrl) {
    return NextResponse.json(
      { error: "MAKE_WEBHOOK_URL est manquant côté serveur." },
      { status: 500 },
    );
  }

  const payload = {
    lastName,
    firstName,
    phone: phoneValues.phone,
    phoneDigits: phoneValues.phoneDigits,
  };

  try {
    const makeResponse = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!makeResponse.ok) {
      return NextResponse.json(
        { error: "Make n'a pas accepté la demande." },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Impossible de contacter Make pour le moment." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, lead: payload });
}
