import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSettings } from "./useSettings";

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
}

export function useSendEmail() {
  const { data: settings } = useSettings();

  return useMutation({
    mutationFn: async (input: SendEmailInput) => {
      if (!input.to) throw new Error("Recipient email is required");
      if (!settings?.resend_api_key) {
        throw new Error("No Resend API key configured. Add it in Settings → Email Configuration.");
      }

      const fromName = settings.email_from_name ?? settings.agency_name ?? "InTravelSync";
      const htmlBody = input.body
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.resend_api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <onboarding@resend.dev>`,
          to: [input.to],
          subject: input.subject,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px">${htmlBody}</div>`,
          reply_to: settings.email_reply_to ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to send email");
      return data;
    },
    onSuccess: () => toast.success("Email sent"),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function buildTourConfirmationEmail({ customerName, tourName, serviceDate, departureTime, bookingRef, seatCount, agencyName }: { customerName: string; tourName: string; serviceDate: string; departureTime: string | null; bookingRef: string | null; seatCount: number; agencyName: string }) {
  return {
    subject: `Your booking confirmation: ${tourName}`,
    body: `Dear ${customerName},\n\nThank you for booking with ${agencyName}!\n\nTour: ${tourName}\nDate: ${serviceDate}\nTime: ${departureTime ?? "TBD"}\nSeats: ${seatCount}\nBooking Reference: ${bookingRef ?? "—"}\n\nWe look forward to welcoming you!\n\nBest regards,\n${agencyName} Team`,
  };
}

export function buildTransferConfirmationEmail({ customerName, transferName, serviceDate, pickupTime, pickupLocation, dropoffLocation, bookingRef, passengerCount, flightNumber, agencyName }: { customerName: string; transferName: string; serviceDate: string; pickupTime: string | null; pickupLocation: string | null; dropoffLocation: string | null; bookingRef: string | null; passengerCount: number; flightNumber: string | null; agencyName: string }) {
  return {
    subject: `Your transfer confirmation: ${transferName}`,
    body: `Dear ${customerName},\n\nYour transfer has been confirmed with ${agencyName}!\n\nRoute: ${transferName}\nDate: ${serviceDate}\nPickup Time: ${pickupTime ?? "TBD"}\nPickup: ${pickupLocation ?? "TBD"}\nDrop-off: ${dropoffLocation ?? "TBD"}\nPassengers: ${passengerCount}${flightNumber ? `\nFlight: ${flightNumber}` : ""}\nBooking Reference: ${bookingRef ?? "—"}\n\nBest regards,\n${agencyName} Team`,
  };
}

// ── Bulk send hook ───────────────────────────────────────────────────────────

import { sendBulkEmail } from "@/fns/data";

export function useSendBulkEmail() {
  const { data: settings } = useSettings();
  return useMutation({
    mutationFn: async (recipients: { to: string; subject: string; body: string }[]) => {
      if (!settings?.resend_api_key) throw new Error("No Resend API key configured. Add it in Settings → Email Configuration.");
      const filtered = recipients.filter((r) => !!r.to);
      if (!filtered.length) throw new Error("No customers with email addresses.");
      return sendBulkEmail({
        data: {
          recipients: filtered,
          resend_api_key: settings.resend_api_key,
          from_name: settings.email_from_name ?? settings.agency_name ?? "InTravelSync",
          reply_to: settings.email_reply_to ?? null,
        },
      });
    },
    onSuccess: (result) => {
      toast.success(`${result.sent} reminder${result.sent !== 1 ? "s" : ""} sent${result.failed ? `, ${result.failed} failed` : ""}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Reminder template builders ────────────────────────────────────────────────

export function buildTourReminderEmail({
  customerName, tourName, serviceDate, departureTime, bookingRef, seatCount, agencyName,
}: { customerName: string; tourName: string; serviceDate: string; departureTime: string | null; bookingRef: string | null; seatCount: number; agencyName: string }) {
  return {
    subject: `Reminder: Your tour "${tourName}" is on ${serviceDate}`,
    body: `Dear ${customerName},\n\nThis is a friendly reminder about your upcoming tour with ${agencyName}.\n\nTour: ${tourName}\nDate: ${serviceDate}\nDeparture: ${departureTime ?? "TBD"}\nSeats: ${seatCount}\nBooking Reference: ${bookingRef ?? "—"}\n\nPlease be ready 10 minutes before departure time.\n\nSee you soon!\n${agencyName} Team`,
  };
}

export function buildTransferReminderEmail({
  customerName, transferName, serviceDate, pickupTime, pickupLocation, dropoffLocation,
  bookingRef, passengerCount, flightNumber, agencyName,
}: { customerName: string; transferName: string; serviceDate: string; pickupTime: string | null; pickupLocation: string | null; dropoffLocation: string | null; bookingRef: string | null; passengerCount: number; flightNumber: string | null; agencyName: string }) {
  return {
    subject: `Reminder: Your transfer on ${serviceDate}`,
    body: `Dear ${customerName},\n\nThis is a reminder about your upcoming transfer with ${agencyName}.\n\nRoute: ${transferName}\nDate: ${serviceDate}\nPickup: ${pickupTime ?? "TBD"} at ${pickupLocation ?? "TBD"}\nDrop-off: ${dropoffLocation ?? "TBD"}\nPassengers: ${passengerCount}${flightNumber ? `\nFlight: ${flightNumber}` : ""}\nBooking Reference: ${bookingRef ?? "—"}\n\nYour driver will be there on time.\n\n${agencyName} Team`,
  };
}

export function buildTripReminderEmail({
  customerName, tripTitle, tripDate, pickupTime, pickupLocation, bookingRef, passengerCount, agencyName,
}: { customerName: string; tripTitle: string; tripDate: string; pickupTime: string | null; pickupLocation: string | null; bookingRef: string | null; passengerCount: number; agencyName: string }) {
  return {
    subject: `Reminder: Your trip "${tripTitle}" on ${tripDate}`,
    body: `Dear ${customerName},\n\nThis is a reminder about your upcoming trip with ${agencyName}.\n\nTrip: ${tripTitle}\nDate: ${tripDate}\nPickup: ${pickupTime ?? "TBD"}${pickupLocation ? ` at ${pickupLocation}` : ""}\nPassengers: ${passengerCount}\nBooking Reference: ${bookingRef ?? "—"}\n\nWe look forward to seeing you!\n\n${agencyName} Team`,
  };
}
