import paginate from '../../utils/paginate.js';
import LedgerTransaction from './ledger.model.js';
class LedgerTransactionService {
    static async FetchLedgerTransactions(kid, page, limit) {
        const data = await paginate(LedgerTransaction, page, limit, "", { kid: kid._id });
        return data;
    }
    static async FetchOneLedgerTransaction(kid, transactionId) {
        const data = await LedgerTransaction.findOne({ kid: kid._id, _id: transactionId });
        return data;
    }
    static async DeleteLedgerTransaction(kid, transactionId) {
        const data = await LedgerTransaction.findOneAndDelete({ kid: kid._id, _id: transactionId });
        return data;
    }
}
export default LedgerTransactionService;
