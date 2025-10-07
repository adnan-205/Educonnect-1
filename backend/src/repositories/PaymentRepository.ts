import Payment, { IPayment } from '../models/Payment';
import { FilterQuery, UpdateQuery } from 'mongoose';

export class PaymentRepository {
  /** Create a payment document. Will initialize statusHistory with the initial status. */
  async create(data: Partial<IPayment>): Promise<IPayment> {
    const statusHistory = [{ status: data.status || 'PENDING', at: new Date() }];
    const doc = await Payment.create({ ...data, statusHistory });
    return doc as IPayment;
  }

  /** Find a single payment document by a filter. */
  async findOne(filter: FilterQuery<IPayment>): Promise<IPayment | null> {
    return Payment.findOne(filter) as any;
  }

  /** Convenience: find by SSLCommerz transaction id. */
  async findByTranId(tranId: string): Promise<IPayment | null> {
    return Payment.findOne({ transactionId: tranId }) as any;
  }

  /** Update status by transaction id and append to statusHistory. */
  async updateStatusByTranId(tranId: string, status: IPayment['status']): Promise<IPayment | null> {
    return Payment.findOneAndUpdate(
      { transactionId: tranId },
      { status, $push: { statusHistory: { status, at: new Date() } } } as UpdateQuery<IPayment>,
      { new: true }
    ) as any;
  }

  /** Mark payment SUCCESS. */
  async markSuccess(tranId: string): Promise<IPayment | null> {
    return this.updateStatusByTranId(tranId, 'SUCCESS');
  }

  /** Mark payment FAILED. */
  async markFailure(tranId: string): Promise<IPayment | null> {
    return this.updateStatusByTranId(tranId, 'FAILED');
  }
}

export default new PaymentRepository();
