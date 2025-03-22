import LedgerTransaction from '../ledgers/ledger.model';
import { ETransactionType } from '../../models/enums';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../models/errors';
import { Wallet } from './wallet.model';

class WalletService {

    static async addFunds(kid: any, amount: any, description: string, transactionName: string) {

        let wallet = await Wallet.findOne({ kid: kid._id });

        if (!wallet) {
            wallet = new Wallet({ kid: kid._id, balance: 0 });
        }
        
        wallet.balance += amount;
        wallet.totalEarnings += amount;
        await wallet.save();

        const transaction = new LedgerTransaction({
            kid: kid._id,
            wallet: wallet._id,
            transactionType: ETransactionType.Credit,
            transactionName: transactionName,
            amount,
            description,
        });
        
          await transaction.save();
        
          return wallet;
    };

    static async deductFunds(kid: any, amount: any, description: string, transactionName: string) { 

        let wallet = await Wallet.findOne({ kid: kid._id });

        if (!wallet) {
          throw new NotFoundError("Wallet not found");
        }

        if (wallet.balance < amount) {
            throw new ForbiddenError("Insufficient funds");
        }
        
        wallet.balance -= amount;
        
        await wallet.save();
        
        const transaction = new LedgerTransaction({
            kid: kid._id,
            wallet: wallet._id,
            transactionType: ETransactionType.Debit,
            transactionName,
            amount,
            description,
        });
        
          await transaction.save();
        
          return wallet;
    }

    static async fetchWallet(kid: any) {
        const wallet = await Wallet.findOne({ kid: kid._id });
        return wallet;
    }   
}

export default WalletService;