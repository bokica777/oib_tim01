import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { AuditLogType } from "../enums/AuditLogType";

export class CreateAuditLogDTO {
  @IsEnum(AuditLogType, { message: "type must be one of INFO|WARNING|ERROR" })
  type!: AuditLogType;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  meta?: any;
}
