import mongoose, {Schema, Document} from 'mongoose';

interface IWallet extends Document {
    kid: mongoose.Schema.Types.ObjectId;
    balance: number;
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
    },
    { timestamps: true }
);

export default mongoose.model<IWallet>("Wallet", WalletSchema);