import mongoose, {Schema, Document} from 'mongoose';

interface IWallet extends Document {
    kid: mongoose.Schema.Types.ObjectId;
    balance: number;
    mainBalance: number;
    totalEarnings: number;
    
}
interface ISavingsWallet extends Document {
    kid: mongoose.Schema.Types.ObjectId;
    balance: number;
    totalEarnings: number;
    savingsGoals: {
        savingId: mongoose.Schema.Types.ObjectId;
        amountSaved: number;
    }[];
}

const WalletSchema: Schema = new mongoose.Schema<IWallet>(
    {
        kid: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Kid",
            required: true,
            unique: true,
        },
        balance: {
            type: Number,
            default: 0,
        },
        mainBalance: {
            type: Number,
            default: 0,
        },
        totalEarnings: {
            type: Number,
            default: 0,
        }
    },
    { timestamps: true }
);

const SavingsWalletSchema: Schema = new mongoose.Schema<ISavingsWallet>(
    {
        kid: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Kid",
            required: true,
            unique: true,
        },
        balance: {
            type: Number,
            default: 0,
        }, 
        totalEarnings: {
            type: Number,
            default: 0,
        },
        savingsGoals: [{
            savingId: { type: mongoose.Schema.Types.ObjectId, ref: "Saving" },
            amountSaved: { type: Number, default: 0 }
        }]
    },
    { timestamps: true }
);

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);
export const SavingsWallet = mongoose.model<IWallet>("SavingsWallet", SavingsWalletSchema);