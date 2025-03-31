import LedgerTransaction from '../ledgers/ledger.model.js';
import { ETransactionType } from '../../models/enums.js';
import { ForbiddenError, NotFoundError } from '../../models/errors.js';
import { Wallet } from './wallet.model.js';
class WalletService {
    static async addFundsToWallet(kid, amount, description, transactionName, session) {
        const options = session ? { session } : {};
        let wallet = await Wallet.findOne({ kid: kid._id }, null, options);
        if (!wallet) {
            wallet = new Wallet({
                kid: kid._id,
                balance: 0,
                totalEarnings: 0
            });
        }
        wallet.balance += amount;
        wallet.mainBalance += amount;
        wallet.totalEarnings += amount;
        await wallet.save(options);
        console.log("I got here");
        const transaction = new LedgerTransaction({
            kid: kid._id,
            wallet: wallet._id,
            transactionType: ETransactionType.Credit,
            transactionName: transactionName,
            amount,
            description,
        });
        await transaction.save(options);
        return wallet;
    }
    static async deductFundsFromWallet(kid, amount, description, transactionName, isExpense = false, isWithdrawal = false, session) {
        const options = session ? { session } : {};
        let wallet = await Wallet.findOne({ kid: kid._id }, null, options);
        if (!wallet) {
            throw new NotFoundError("Wallet not found");
        }
        if (wallet.balance < amount) {
            throw new ForbiddenError("Insufficient funds");
        }
        wallet.balance -= amount;
        if (isExpense) {
            wallet.mainBalance -= amount;
        }
        if (isWithdrawal) {
            wallet.mainBalance -= amount;
            wallet.balance = 0;
        }
        await wallet.save(options);
        const transaction = new LedgerTransaction({
            kid: kid._id,
            wallet: wallet._id,
            transactionType: ETransactionType.Debit,
            transactionName,
            amount,
            description,
        });
        await transaction.save(options);
        return wallet;
    }
    static async fetchWallet(kid) {
        const wallet = await Wallet.findOne({ kid: kid._id });
        return wallet;
    }
}
export default WalletService;
