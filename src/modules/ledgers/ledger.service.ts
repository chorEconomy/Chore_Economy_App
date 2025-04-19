import paginate from '../../utils/paginate.js';
import LedgerTransaction from './ledger.model.js';

class LedgerTransactionService {
    static async FetchLedgerTransactions(kid: any, page: number, limit: number) {
        const data = await paginate(LedgerTransaction, page, limit, "", { kid: kid._id });
        return data;
    }

    static async FetchOneLedgerTransaction(kid: any, transactionId: any) { 
        const data = await LedgerTransaction.findOne({kid: kid._id, _id: transactionId });
        return data;
    }

    static async DeleteLedgerTransaction( kid: any, transactionId: any) { 
        const data = await LedgerTransaction.findOneAndDelete({kid: kid._id, _id: transactionId });
        return data;    
    }

}

export default LedgerTransactionService;