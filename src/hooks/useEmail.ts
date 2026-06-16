import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: input.to,
          subject: input.subject,
          body: input.body,
          from_name: settings.email_from_name ?? settings.agency_name,
          reply_to: settings.email_reply_to ?? settings.contact_email,
          resend_api_key: settings.resend_api_key,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => toast.success("Email sent successfully"),
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Build standard email bodies ─────────────────────────────────────────────

export function buildTourConfirmationEmail({
  customerName,
  tourName,
  serviceDate,
  departureTime,
  bookingRef,
  seatCount,
  agencyName,
}: {
  customerName: string;
  tourName: string;
  serviceDate: string;
  departureTime: string | null;
  bookingRef: string | null;
  seatCount: number;
  agencyName: string;
}) {
  return {
    subject: `Your booking confirmation: ${tourName}`,
    body: `Dear ${customerName},

Thank you for booking with ${agencyName}!

BOOKING DETAILS
───────────────
Tour: ${tourName}
Date: ${serviceDate}
Time: ${departureTime ?? "TBD"}
Seats: ${seatCount}
Booking Reference: ${bookingRef ?? "—"}

Please arrive 10 minutes before departure time. Your guide will be waiting for you.

If you have any questions, don't hesitate to contact us.

Best regards,
${agencyName} Team`,
  };
}

export function buildTransferConfirmationEmail({
  customerName,
  transferName,
  serviceDate,
  pickupTime,
  pickupLocation,
  dropoffLocation,
  bookingRef,
  passengerCount,
  flightNumber,
  agencyName,
}: {
  customerName: string;
  transferName: string;
  serviceDate: string;
  pickupTime: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  bookingRef: string | null;
  passengerCount: number;
  flightNumber: string | null;
  agencyName: string;
}) {
  return {
    subject: `Your transfer confirmation: ${transferName}`,
    body: `Dear ${customerName},

Your transfer has been confirmed with ${agencyName}!

TRANSFER DETAILS
───────────────
Route: ${transferName}
Date: ${serviceDate}
Pickup Time: ${pickupTime ?? "TBD"}
Pickup Location: ${pickupLocation ?? "TBD"}
Drop-off: ${dropoffLocation ?? "TBD"}
Passengers: ${passengerCount}${flightNumber ? `\nFlight: ${flightNumber}` : ""}
Booking Reference: ${bookingRef ?? "—"}

Your driver will be waiting for you at the pickup location with a sign bearing your name.

Best regards,
${agencyName} Team`,
  };
}
