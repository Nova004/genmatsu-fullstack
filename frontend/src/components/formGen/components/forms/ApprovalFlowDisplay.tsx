// local src/components/formGen/components/forms/ApprovalFlowDisplay.tsx
import React, { useState, useEffect } from "react";
import {
  getApprovalFlowBySubmissionId,
  performApprovalAction,
} from "../../../../services/approvalService";
// ❌ ลบอันเก่า: import { ApprovalFlowStep } from "../../pages/types";
// ✅ ใช้อันใหม่จาก api.ts แทน:
import type { ApprovalFlowStep } from "../../../../types/api";

import Loader from "../../../../common/Loader";
import { useAuth } from "../../../../context/AuthContext";
import { fireToast } from "../../../../hooks/fireToast";

interface Props {
  submissionId: number;
  submissionData: any;
}

// (ฟังก์ชัน getLevelName เหมือนเดิม)
const getLevelName = (level: number) => {
  switch (level) {
    case 1:
      return "Shift Leader"; // (ตรงกับ Reviewer/Sup.Up ของคุณ)
    case 2:
      return "Sr. Staff"; // (ตรงกับ Approve1/Asst.Mgr.Up ของคุณ)
    case 3:
      return "Supervisor"; // (ตรงกับ Approve2/GM ของคุณ)
    default:
      return `Level ${level}`;
  }
};

// (ฟังก์ชัน getStatusAttributes เหมือนเดิม - เราอาจจะไม่ได้ใช้ className โดยตรง แต่ยังใช้สีได้)
const getStatusAttributes = (status: ApprovalFlowStep["status"]) => {
  switch (status) {
    case "Approved":
      return {
        className: "text-success bg-success/10",
        icon: "✓",
      };
    case "Rejected":
      return {
        className: "text-danger bg-danger/10",
        icon: "✕",
      };
    case "Pending":
    default:
      return {
        className: "text-warning bg-warning/10",
        icon: "…",
      };
  }
};

const ApprovalFlowDisplay: React.FC<Props> = ({ submissionId, submissionData }) => {
  const { user } = useAuth();
  const [flowSteps, setFlowSteps] = useState<ApprovalFlowStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState("");

  // Determine category based on form_type or other properties
  const category = submissionData?.form_type === 'Ironpowder' ? 'Recycle' : 'General';

  const currentStep = flowSteps.find((step) => step.status === "Pending");
  const canApprove = user && currentStep && user.LV_Approvals === currentStep.required_level;

  const allComments = flowSteps.filter(
    (step) =>
      step.comment &&
      (step.status === "Approved" || step.status === "Rejected")
  );

  const fetchFlow = async () => {
    // ... (ลอจิก fetchFlow เหมือนเดิม)
    setIsLoading(true);
    setError(null);
    try {
      const data = await getApprovalFlowBySubmissionId(submissionId, category); // Pass category
      setFlowSteps(data);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลการอนุมัติได้");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!submissionId) return;
    fetchFlow();
  }, [submissionId]);

  const handleAction = async (action: "Approved" | "Rejected") => {
    if (!user || !currentStep) return;
    if (action === "Rejected" && !comment.trim()) {
      fireToast("error", "กรุณากรุณากรอกเหตุผลในช่อง Comment ก่อน Reject");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        submissionId: submissionId,
        action: action,
        comment: comment,
        approverUserId: user.id,
        category: category, // Pass category
      };
      await performApprovalAction(payload);
      fireToast("success", `ดำเนินการ ${action} สำเร็จ!`);
      setComment("");
      fetchFlow();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "เกิดข้อผิดพลาด";
      fireToast("error", `ดำเนินการไม่สำเร็จ: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  // =================================================================
  // 🚀 [ปรับปรุง] ส่วน Render Logic ใหม่
  // =================================================================

  // ‼️ 3. สร้างตัวแปรสำหรับ "เติม" ตาราง 4 ช่อง ‼️

  // (ข้อมูลคนสร้าง - ต้องเช็คว่า property ชื่ออะไร)
  // ⚠️ "creator_name" และ "created_at" เป็นชื่อสมมติ, คุณต้องเปลี่ยนเป็นชื่อที่ถูกต้องจาก object "submissionData"
  const creator = {
    name: submissionData?.submitted_by_name || submissionData?.submitted_by || "N/A",
    // ✅ Prioritize production_date (General) or report_date (Ironpowder), fallback to created/submitted
    date: submissionData?.production_date || submissionData?.report_date || submissionData?.submitted_at || submissionData?.created_at || null,
  };

  console.log('ข้อมูล submissionData ที่ได้รับมา:', submissionData);

  // (ข้อมูล Flow - ดึงจาก array ที่ fetch มา)
  const stepLv1 = flowSteps.find((step) => step.required_level === 1);
  const stepLv2 = flowSteps.find((step) => step.required_level === 2);
  const stepLv3 = flowSteps.find((step) => step.required_level === 3);

  // --- (ส่วนแสดงผล Loading, Error ... เหมือนเดิม) ---
  if (isLoading) return <Loader />;
  if (error) return <div className="text-danger">{error}</div>;
  // (เราจะไม่ return null ถ้า flowSteps.length === 0 เพราะเราต้องวาดตาราง 4 ช่องเสมอ)

  // ‼️ 4. ฟังก์ชันผู้ช่วยสำหรับวาด "ช่อง" อนุมัติ (LV1, LV2, LV3) ‼️
  const renderApprovalCell = (
    title: string,
    stepData: ApprovalFlowStep | undefined
  ) => {
    // เช็คว่าใช่ช่องที่เรารออนุมัติหรือไม่
    const isCurrentActionableStep =
      stepData &&
      stepData.status === "Pending" &&
      stepData.flow_id === currentStep?.flow_id &&
      canApprove;

    return (
      <div className="flex flex-col border-b border-r border-stroke dark:border-strokedark">
        {/* 1. ส่วนหัว (Title) */}
        <div className="bg-gray-2 p-2 text-center font-medium text-black dark:bg-meta-4 dark:text-white">
          {title}
        </div>

        {/* 2. ส่วนเนื้อหา (Name / Status / Buttons) */}
        <div className="flex min-h-[100px] flex-col items-center justify-center p-3 text-center">
          {/* A: ถ้าไม่มีข้อมูล step นี้ (เช่น L0 เขียน, L1 ข้ามไป) */}
          {!stepData && (
            <span className="font-medium text-gray-400 dark:text-gray-600">
              —
            </span>
          )}

          {/* B: ถ้า Approved แล้ว */}
          {stepData && stepData.status === "Approved" && (
            <span className="font-medium text-success">
              {stepData.approver_name || "N/A"}
            </span>
          )}

          {/* C: ถ้า Rejected แล้ว */}
          {stepData && stepData.status === "Rejected" && (
            <>
              <span className="font-medium text-danger">
                {stepData.approver_name || "N/A"}
              </span>
              <span className="mt-1 text-sm font-bold text-danger">
                (REJECTED)
              </span>
            </>
          )}

          {/* D: ถ้า Pending และ "เรา" กดได้ */}
          {stepData && isCurrentActionableStep && (
            <div className="flex scale-90 flex-col gap-2">
              <button
                onClick={() => handleAction("Approved")}
                disabled={isSubmitting}
                className="flex justify-center rounded bg-success px-4 py-1 text-sm font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction("Rejected")}
                disabled={isSubmitting}
                className="flex justify-center rounded bg-danger px-4 py-1 text-sm font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}

          {/* E: ถ้า Pending แต่ "เรา" กดไม่ได้ */}
          {stepData && stepData.status === "Pending" && !isCurrentActionableStep && (
            <span className="font-medium text-warning"></span>
          )}
        </div>

        {/* 3. ส่วนท้าย (Date) */}
        <div className="border-t border-stroke p-2 text-center text-sm dark:border-strokedark">
          {stepData?.updated_at ? (
            new Date(stepData.updated_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: 'UTC'
            })
          ) : (
            <>&nbsp;</>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">

      <div className="border-b-2 border-stroke py-2 text-center bg-black dark:border-strokedark ">
        <h4 className="font-medium text-white text-lg"> สถานะการอนุมัติ (Approval Flow)</h4>
      </div>

      {/* --- นี่คือตาราง 4 ช่อง (Grid 4 คอลัมน์) --- */}
      <div className="grid grid-cols-4 border-l border-t border-stroke dark:border-strokedark">

        {/* --- Column 1: ผู้จัดทำ (จาก submissionData) --- */}
        <div className="flex flex-col border-b border-r border-stroke dark:border-strokedark">
          <div className="bg-gray-2 p-2 text-center font-medium text-black dark:bg-meta-4 dark:text-white">
            Record by:
          </div>
          <div className="flex min-h-[100px] flex-col items-center justify-center p-3 text-center">
            <span className="font-medium text-black dark:text-white">
              {creator.name}
            </span>
          </div>
          <div className="border-t border-stroke p-2 text-center text-sm dark:border-strokedark">
            {creator.date ? (
              new Date(creator.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: 'UTC'
              })
            ) : (
              <>&nbsp;</>
            )}
          </div>
        </div>

        {/* --- Column 2: LV 1 (จาก flowSteps) --- */}
        {renderApprovalCell("Checked Shift Leader by.", stepLv1)}

        {/* --- Column 3: LV 2 (จาก flowSteps) --- */}
        {renderApprovalCell("Checked Sr. Staff by", stepLv2)}

        {/* --- Column 4: LV 3 (จาก flowSteps) --- */}
        {renderApprovalCell("Approved Supervisor by", stepLv3)}

      </div>

      {/* ‼️ [ใหม่] ส่วนแสดง "Log คอมเมนต์" ‼️ */}
      {allComments.length > 0 && (
        <div className="mt-6 border-t border-stroke pt-4 dark:border-strokedark">
          <h5 className="mb-3 font-semibold text-black dark:text-white">
            ประวัติคอมเมนต์ (Comment Log)
          </h5>
          <div className="flex flex-col gap-3">
            {allComments.map((step) => (
              <div
                key={step.flow_id}
                className="rounded-sm border border-stroke p-3 dark:border-strokedark"
              >
                <p className="text-sm text-black dark:text-white">
                  "{step.comment}"
                </p>
                <span
                  className={`mt-1 text-xs font-medium ${step.status === "Rejected" ? "text-danger" : "text-success"
                    }`}
                >
                  — {step.approver_name || "N/A"} ({step.status})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- (ส่วน Comment Box เหมือนเดิม) --- */}
      {canApprove && (
        <div className="mt-6 border-t border-stroke pt-4 dark:border-strokedark">
          <h5 className="mb-2 font-medium">
            Comment (สำหรับ {currentStep.required_level === 1 ? "LV1" : currentStep.required_level === 2 ? "LV2" : "LV3"})
          </h5>
          <textarea
            rows={3}
            placeholder="Comment (จำเป็น หาก Reject)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          ></textarea>
        </div>
      )}
    </div>
  );
};

export default ApprovalFlowDisplay;