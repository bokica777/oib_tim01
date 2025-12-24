// src/Services/ReceiptService.ts
import { Repository } from "typeorm";
import { Receipt, SaleType, PaymentType } from "../Domain/models/Receipt";
import { ReceiptItem } from "../Domain/models/ReceiptItem";
import { CreateReceiptDto } from "../Domain/DTOs/ReceiptDTO";
import { IReceiptService } from "../Domain/services/IReceiptService"; 

export class ReceiptService implements IReceiptService {
  private receiptRepository: Repository<Receipt>;

  constructor(receiptRepository: Repository<Receipt>) {
    this.receiptRepository = receiptRepository;
  }

  public async createReceipt(dto: CreateReceiptDto): Promise<Receipt> {
    // 1) Napravi novi Receipt entitet
    const receipt = new Receipt();

    receipt.brojRacuna = this.generateReceiptNumber();
    receipt.tipProdaje = dto.tipProdaje as SaleType;
    receipt.nacinPlacanja = dto.nacinPlacanja as PaymentType; 

    // 2) Mapiraj stavke iz DTO-a u ReceiptItem entitete
    receipt.stavke = dto.stavke.map((itemDto) => {
      const item = new ReceiptItem();
      item.parfemId = itemDto.parfemId;
      item.nazivParfema = itemDto.nazivParfema;
      item.kolicina = itemDto.kolicina;
      item.jedinicnaCena = itemDto.jedinicnaCena;
      item.ukupno = itemDto.kolicina * itemDto.jedinicnaCena;
      return item;
    });

    // 3) Izračunaj ukupan iznos računa
    receipt.ukupanIznos = receipt.stavke.reduce(
      (sum, stavka) => sum + Number(stavka.ukupno),
      0
    );

    // 4) Sačuvaj u bazi (kroz TypeORM, cascade će sačuvati i stavke)
    const saved = await this.receiptRepository.save(receipt);

    return saved;
  }

  // vrlo prost broj računa, možeš kasnije ulepsšati
  private generateReceiptNumber(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const t = String(now.getTime()).slice(-6); // zadnjih 6 cifara timestampa
    return `FR-${y}${m}${d}-${t}`;
  }

    public async getAllReceipts(): Promise<Receipt[]> {
        return this.receiptRepository.find({ relations: ["stavke"]});
    }

    public async getDailyRevenue(date: string): Promise<number> {

        const result = await this.receiptRepository
        .createQueryBuilder("r")
        .select("SUM(r.ukupanIznos)", "total")
        .where("DATE(r.datumVreme) = :date", { date })
        .getRawOne();

        return Number(result?.total ?? 0);
    }
    public async getSalesByProduct(): Promise<any[]> {

    return this.receiptRepository
        .createQueryBuilder("r")
        .leftJoin("r.stavke", "s")
        .select("s.nazivParfema", "product")
        .addSelect("SUM(s.kolicina)", "kolicina")
        .addSelect("SUM(s.ukupno)", "prihod")
        .groupBy("s.nazivParfema")
        .orderBy("prihod", "DESC")
        .getRawMany();
    }



}
