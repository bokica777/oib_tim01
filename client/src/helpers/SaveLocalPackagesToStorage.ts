import { StoragePackageDTO } from "../models/storage/StoragePackageDTO";
export function saveLocalPackagesToStorage(pkgs: StoragePackageDTO[]) {
  try {
    localStorage.setItem("localPackages_v1", JSON.stringify(pkgs));
  } catch (e) {
    console.warn("Failed to save localPackages to localStorage", e);
  }
}