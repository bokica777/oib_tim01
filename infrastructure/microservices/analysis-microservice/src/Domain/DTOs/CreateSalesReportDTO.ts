import { IsIn, IsString } from "class-validator";

export class CreateSalesReportDTO {
  @IsIn(["week", "month", "year"])
  groupBy!: "week" | "month" | "year";

  @IsString()
  from!: string; 

  @IsString()
  to!: string;
}
