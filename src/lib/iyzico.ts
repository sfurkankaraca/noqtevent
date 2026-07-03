import Iyzipay from "iyzipay";

// iyzico Checkout Form entegrasyonu — kart bilgisi iyzico'nun barındırılan
// sayfasında girilir (PCI-DSS yükü yok). Sandbox için IYZICO_BASE_URL'i
// https://sandbox-api.iyzipay.com yapın; canlıda https://api.iyzipay.com

export function isIyzicoConfigured(): boolean {
  return Boolean(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY);
}

function client(): Iyzipay {
  return new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY!,
    secretKey: process.env.IYZICO_SECRET_KEY!,
    uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
  });
}

export type CheckoutInit = {
  token: string;
  paymentPageUrl: string;
};

export function initCheckoutForm(params: {
  conversationId: string;
  basketId: string;
  price: number; // TL
  callbackUrl: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    phone?: string | null;
    ip: string;
    city?: string | null;
  };
  itemName: string;
}): Promise<CheckoutInit> {
  const priceStr = params.price.toFixed(2);
  const city = params.buyer.city?.trim() || "Istanbul";
  const address = {
    contactName: `${params.buyer.name} ${params.buyer.surname}`.trim(),
    city,
    country: "Turkey",
    address: city, // hizmet satışı — fiziksel teslimat adresi yok
  };

  return new Promise((resolve, reject) => {
    client().checkoutFormInitialize.create(
      // @types/iyzipay bu isteği yanlış tipliyor (paymentCard'lı 3DS isteği sanıyor);
      // gerçek Checkout Form API'sinde kart alanı yoktur — cast şart.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: params.conversationId,
        price: priceStr,
        paidPrice: priceStr,
        currency: Iyzipay.CURRENCY.TRY,
        basketId: params.basketId,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: params.callbackUrl,
        buyer: {
          id: params.buyer.id,
          name: params.buyer.name || "Müşteri",
          surname: params.buyer.surname || "—",
          gsmNumber: params.buyer.phone || undefined,
          email: params.buyer.email,
          // Hizmet satışında TCKN toplamıyoruz — iyzico zorunlu alanı için placeholder
          identityNumber: "11111111111",
          registrationAddress: address.address,
          ip: params.buyer.ip,
          city,
          country: "Turkey",
        },
        shippingAddress: address,
        billingAddress: address,
        basketItems: [
          {
            id: params.basketId,
            name: params.itemName.slice(0, 120),
            category1: "Etkinlik Hizmeti",
            itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
            price: priceStr,
          },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: unknown, result: any) => {
        if (err) return reject(err instanceof Error ? err : new Error(String(err)));
        if (result?.status !== "success" || !result.paymentPageUrl) {
          return reject(new Error(result?.errorMessage ?? "iyzico ödeme formu oluşturulamadı."));
        }
        resolve({ token: result.token, paymentPageUrl: result.paymentPageUrl });
      }
    );
  });
}

export type CheckoutResult = {
  paymentStatus: string; // "SUCCESS" beklenir
  paymentId: string;
  paidPrice: number;
  basketId: string;
  conversationId: string;
  cardLastFour?: string;
  errorMessage?: string;
  itemTransactionId?: string; // iade için gerekli
};

export function retrieveCheckoutForm(token: string): Promise<CheckoutResult> {
  return new Promise((resolve, reject) => {
    client().checkoutForm.retrieve(
      { locale: Iyzipay.LOCALE.TR, token },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: unknown, result: any) => {
        if (err) return reject(err instanceof Error ? err : new Error(String(err)));
        if (result?.status !== "success") {
          return reject(new Error(result?.errorMessage ?? "Ödeme sonucu alınamadı."));
        }
        resolve({
          paymentStatus: result.paymentStatus,
          paymentId: String(result.paymentId ?? ""),
          paidPrice: Number(result.paidPrice ?? 0),
          basketId: String(result.basketId ?? ""),
          conversationId: String(result.conversationId ?? ""),
          cardLastFour: result.lastFourDigits,
          errorMessage: result.errorMessage,
          itemTransactionId: result.itemTransactions?.[0]?.paymentTransactionId
            ? String(result.itemTransactions[0].paymentTransactionId)
            : undefined,
        });
      }
    );
  });
}

export type RefundResult = { success: boolean; message?: string };

// Kısmi veya tam iade — paymentTransactionId, ödeme kaydedilirken saklanan
// itemTransactionId'dir (paymentId değil).
export function refundPayment(params: {
  paymentTransactionId: string;
  price: number;
  ip: string;
  conversationId?: string;
}): Promise<RefundResult> {
  return new Promise((resolve, reject) => {
    client().refund.create(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: params.conversationId ?? `refund-${Date.now()}`,
        paymentTransactionId: params.paymentTransactionId,
        price: params.price.toFixed(2),
        currency: Iyzipay.CURRENCY.TRY,
        ip: params.ip,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: unknown, result: any) => {
        if (err) return reject(err instanceof Error ? err : new Error(String(err)));
        if (result?.status !== "success") {
          return resolve({ success: false, message: result?.errorMessage ?? "İade başarısız." });
        }
        resolve({ success: true });
      }
    );
  });
}
