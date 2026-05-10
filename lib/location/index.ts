// Location utilities - Production-grade geolocation like Meesho/Blinkit/Zepto

export {
  detectLocation,
  getCurrentPosition,
  reverseGeocodeGoogle,
  reverseGeocodeOSM,
  getLocationByIP,
  searchAddresses,
  getPlaceDetails,
  validateAndGetPincodeLocation,
  clearLocationCache,
  type LocationResult,
  type AddressSuggestion,
} from "./geolocation";

export { useGeolocation } from "./useGeolocation";
