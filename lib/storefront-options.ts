// Dealer storefront field limits, shared by the client form and server
// validation. Keep in sync with the dealer_storefront migration's checks.

export const BUSINESS_NAME_MAX = 80;
export const ABOUT_MAX = 1000;
export const SHOWROOM_ADDRESS_MAX = 200;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
