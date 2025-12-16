export interface ILogerService {
  log(message: string, type?: "INFO" | "WARNING" | "ERROR", meta?: any): Promise<boolean>;
}
