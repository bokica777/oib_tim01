import { StoragePackageDTO } from "../models/storage/StoragePackageDTO";
export function loadLocalPackagesFromStorage(): StoragePackageDTO[] {
  try {
    const raw = localStorage.getItem("localPackages_v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.warn("Failed to parse localPackages from localStorage", e);
    return [];
  }
}