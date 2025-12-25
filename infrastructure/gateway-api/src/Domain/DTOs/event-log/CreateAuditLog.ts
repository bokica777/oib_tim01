import { IsEnum, IsString } from "class-validator";
import { AuditLogType } from "../../enums/event-log/AuditLogType"; 

export class CreateAuditLogDTO {
  @IsEnum(AuditLogType)
  type!: AuditLogType;

  @IsString()
  message!: string;
}
