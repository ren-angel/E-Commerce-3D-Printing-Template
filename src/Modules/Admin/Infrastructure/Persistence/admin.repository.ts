import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminRepositoryInterface } from "../../Domain/Repositories/admin.repository.interface";
import { AdminEntity } from "../../Domain/Entities/admin.entity";

// Add commentary to explain the purpose of this class and its methods

@Injectable()
export class TypeOrmAdminRepository implements AdminRepositoryInterface {

  constructor(
    @InjectRepository(AdminEntity) private readonly adminRepository: Repository<AdminEntity>,
  ) {}

  findOne(adminEmail: string, adminPassword: string): Promise<AdminEntity | null> {

    return this.adminRepository.findOne({ where: { adminEmail, adminPassword } });
  }
}