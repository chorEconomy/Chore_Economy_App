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
    static async deductFundsFromWallet(kidId, walletId, amount, description, transactionName, session) {
        const options = session ? { session } : {};
        let wallet = await Wallet.findOne({ _id: walletId }, null, options);
        if (!wallet) {
            throw new NotFoundError("Wallet not found");
        }
        if (amount > wallet.mainBalance) {
            throw new ForbiddenError("Insufficient funds");
        }
        wallet.mainBalance -= amount;
        wallet.balance = 0;
        await wallet.save(options);
        const transaction = new LedgerTransaction({
            kid: kidId,
            wallet: wallet._id,
            transactionType: ETransactionType.Debit,
            transactionName,
            amount,
            description,
        });
        await transaction.save(options);
        return wallet;
    }
    static async deductSavingsFromWallet(kid, amount, description, transactionName, session) {
        const options = session ? { session } : {};
        let wallet = await Wallet.findOne({ kid: kid._id }, null, options);
        if (!wallet) {
            throw new NotFoundError("Wallet not found");
        }
        if (amount > wallet.mainBalance) {
            throw new ForbiddenError("Insufficient funds");
        }
        wallet.mainBalance -= amount;
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
    static async deductExpenseFromWallet(kid, amount, description, transactionName, session) {
        const options = session ? { session } : {};
        let wallet = await Wallet.findOne({ kid: kid._id }, null, options);
        if (!wallet) {
            throw new NotFoundError("Wallet not found");
        }
        if (amount > wallet.balance) {
            throw new ForbiddenError("Insufficient funds");
        }
        wallet.balance -= amount;
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
    static async saveMoney(kid, amount, description, transactionName, session) {
        const options = session ? { session } : {};
        let wallet = await Wallet.findOne({ kid: kid._id }, null, options);
        if (!wallet) {
            throw new NotFoundError("Wallet not found");
        }
        if (amount > wallet.balance) {
            throw new ForbiddenError("Insufficient funds");
        }
        wallet.balance -= amount;
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
    static async fetchWallet(kidId) {
        const wallet = await Wallet.findOne({ kid: kidId });
        return wallet;
    }
}
export default WalletService;
