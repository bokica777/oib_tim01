import { IsIn, IsString } from "class-validator";

export class CreateSalesReportDTO {
  @IsIn(["week", "month", "year"])
  groupBy!: "week" | "month" | "year";

  @IsString()
  from!: string; // YYYY-MM-DD

  @IsString()
  to!: string; // YYYY-MM-DD
}
