// frontend/src/pages/Reports/components/BarcodePage.tsx
import React, { useEffect, useState } from 'react';
import { getRawMaterialWeights, RawMaterialWeightData } from '../../../services/weightService';
import { getCurrentDate, formatTime } from '../../../utils/utils';

interface BarcodePageProps {
    lotNo: string;
    lineName: string;
    batch: string;
}

const BarcodePage: React.FC<BarcodePageProps> = ({ lotNo, lineName, batch }) => {
    const [data, setData] = useState<RawMaterialWeightData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!lotNo || !lineName || !batch) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await getRawMaterialWeights(lotNo, lineName, batch);
                setData(result);
            } catch (err: any) {
                console.error("Error fetching barcode data:", err);
                setError(err.message || "Failed to load barcode data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [lotNo, lineName, batch]);

    if (loading) return <div className="p-4 text-center">Loading Barcode Data...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;
    if (data.length === 0) return null;

    const StickerCard = ({ item }: { item: RawMaterialWeightData }) => {
        const fullLot = `${lotNo}${lineName}${batch}`;
        const qrValue = `${item.Material_Weight_Detail_Id}/${fullLot}/${item.Gen_Name}/${item.Material_Name}/${item.Material_Lot}/${item.Order_No}/${item.Invoice_No}/${item.Weight}/${item.Staff_Name}/${getCurrentDate(item.Updated_Date)}/${formatTime(item.Updated_Time)}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrValue)}`;


        return (
            <div className="border-[2px] border-dashed border-black p-2 bg-white flex flex-col text-black h-fit break-inside-avoid relative">
                {/* Header */}
                <div className="border-b-2 border-black text-center pb-1 mb-1">
                    <h3 className="font-bold text-lg leading-none">Wait for use</h3>
                </div>

                {/* Material Name */}
                <div className="text-center mb-2">
                    <h4 className="font-bold text-md leading-none">{item.Material_Name}</h4>
                </div>

                {/* Body Flex Container */}
                <div className="flex justify-between items-start gap-2 text-[11px] font-bold leading-tight">
                    {/* Left Column */}
                    <div className="flex flex-col gap-1 flex-1">
                        <div>Genmatsu : {item.Gen_Name}</div>
                        <div>RM Lot No : {item.Material_Lot}</div>
                        <div className="whitespace-nowrap">PO No : {item.Order_No}</div>
                        <div className="whitespace-nowrap">INV No : {item.Invoice_No}</div>
                        <div>By : {item.Staff_Name}</div>
                        <div>Date : {getCurrentDate(item.Updated_Date)}</div>
                        <div>ID : {item.Material_Weight_Detail_Id}</div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-1 items-end text-right min-w-[30%]">
                        <div className="whitespace-nowrap">Lot No : {fullLot}</div>
                        <div className="whitespace-nowrap">Vol (kg.) : {item.Weight}</div>

                        {/* QR Code placed under Vol */}
                        <div className="mt-1">
                            <img src={qrUrl} alt="QR Code" className="w-[90px] h-[90px] object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div id="barcode-content-ready" className="a4-page-container relative rounded-sm border border-stroke bg-white flex flex-col p-8" style={{ pageBreakBefore: 'always', minHeight: '297mm' }}>
            <div className="grid grid-cols-2 gap-4">
                {data.map((item, index) => (
                    <StickerCard key={index} item={item} />
                ))}
            </div>
        </div>
    );
};

export default BarcodePage;
