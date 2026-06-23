import React, { useState } from 'react';
import { 
  Play, Plus, RefreshCw, BarChart2, Clock, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { BorderedCard } from '@/components/shared/BorderedCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { BorderBeam } from '@/components/ui/border-beam';
import CrudTable from '@/components/crud_table/crud-table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { benchmarkRunColumns } from './benchmark-run-columns';
import { benchmarkQuestionColumns } from './benchmark-question-columns';
import { 
  benchmarkApi, 
  useBenchmarkQuestionsQuery, 
  useBenchmarkHistoryQuery, 
  useAdminBenchmarks 
} from '@/features/admin';
import type { BenchmarkQuestion, BenchmarkRun } from '@/features/admin';

export const BenchmarkPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('comparison');
  
  // Benchmark logic hook
  const { 
    createQuestion, 
    updateQuestion, 
    deleteQuestion, 
    runBenchmark, 
    deleteRun 
  } = useAdminBenchmarks();

  // Run Benchmark State
  const [runningBenchmark, setRunningBenchmark] = useState<boolean>(false);
  const [approachName, setApproachName] = useState<string>('');
  
  // Compare State
  const [selectedRunAId, setSelectedRunAId] = useState<string>('');
  const [selectedRunBId, setSelectedRunBId] = useState<string>('');

  // Expand state for compared questions
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  // Question Dialog State
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<BenchmarkQuestion | null>(null);
  const [questionText, setQuestionText] = useState<string>('');
  const [groundTruthText, setGroundTruthText] = useState<string>('');

  // Fetch details for compared runs
  const { data: runADetails } = useQuery({
    queryKey: ['benchmarkRunDetails', selectedRunAId],
    queryFn: () => benchmarkApi.getRunDetails(selectedRunAId),
    enabled: !!selectedRunAId,
  });

  const { data: runBDetails } = useQuery({
    queryKey: ['benchmarkRunDetails', selectedRunBId],
    queryFn: () => benchmarkApi.getRunDetails(selectedRunBId),
    enabled: !!selectedRunBId,
  });

  // Query to get all history for select drop-downs
  const { data: allHistoryData } = useQuery({
    queryKey: ['allBenchmarkHistoryDropdown'],
    queryFn: () => benchmarkApi.getHistory({ page: 1, limit: 100 }),
  });
  const dropdownHistory = allHistoryData?.data || [];

  // Table lists handlers
  const handleSelectA = (id: number, name: string) => {
    setSelectedRunAId(id.toString());
    toast.info(`Đã chọn ${name} làm Lượt chạy A`);
  };

  const handleSelectB = (id: number, name: string) => {
    setSelectedRunBId(id.toString());
    toast.info(`Đã chọn ${name} làm Lượt chạy B`);
  };

  const handleDeleteRun = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lượt benchmark này không?')) return;
    try {
      await deleteRun(id);
      toast.success('Xóa lượt chạy thành công!');
      if (selectedRunAId === id.toString()) setSelectedRunAId('');
      if (selectedRunBId === id.toString()) setSelectedRunBId('');
      queryClient.invalidateQueries({ queryKey: ['allBenchmarkHistoryDropdown'] });
    } catch (error: any) {
      toast.error('Không thể xóa: ' + (error.message || 'Lỗi hệ thống'));
    }
  };

  // Question CRUD Operations
  const handleOpenAddDialog = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setGroundTruthText('');
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (q: BenchmarkQuestion) => {
    setEditingQuestion(q);
    setQuestionText(q.question);
    setGroundTruthText(q.groundTruth);
    setOpenDialog(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionText.trim() || !groundTruthText.trim()) {
      toast.warning('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const payload = { question: questionText, groundTruth: groundTruthText };
      if (editingQuestion) {
        await updateQuestion({ id: editingQuestion.id, data: payload });
        toast.success('Cập nhật câu hỏi kiểm thử thành công!');
      } else {
        await createQuestion(payload);
        toast.success('Tạo câu hỏi kiểm thử mới thành công!');
      }
      setOpenDialog(false);
    } catch (error: any) {
      toast.error('Không thể lưu câu hỏi: ' + (error.message || 'Lỗi hệ thống'));
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) return;
    try {
      await deleteQuestion(id);
      toast.success('Xóa câu hỏi thành công!');
    } catch (error: any) {
      toast.error('Không thể xóa câu hỏi: ' + (error.message || 'Lỗi hệ thống'));
    }
  };

  // Run Benchmark Evaluation
  const handleRunBenchmark = async () => {
    if (!approachName.trim()) {
      toast.warning('Vui lòng nhập tên hướng tiếp cận để dán nhãn lần chạy');
      return;
    }

    setRunningBenchmark(true);
    const toastId = toast.loading('Đang chạy đánh giá chất lượng RAG bằng Ragas & Gemini 2.5 Flash... Quá trình này có thể mất vài phút.', { duration: 120000 });
    try {
      const newRun = await runBenchmark({ approachName });
      toast.dismiss(toastId);
      toast.success(`Chạy benchmark thành công cho hướng tiếp cận: ${approachName}!`);
      setApproachName('');
      queryClient.invalidateQueries({ queryKey: ['allBenchmarkHistoryDropdown'] });
      // Auto select the new run as Run B for immediate comparison
      if (newRun && newRun.id) {
        setSelectedRunBId(newRun.id.toString());
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error('Có lỗi xảy ra khi chạy benchmark: ' + (error.response?.data?.message || error.message || 'Lỗi hệ thống'));
    } finally {
      setRunningBenchmark(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Prepare chart data
  const getChartData = () => {
    if (!runADetails && !runBDetails) return [];
    
    return [
      {
        name: 'Faithfulness',
        [runADetails?.approachName || 'Lần chạy A']: runADetails ? Math.round(runADetails.ragasFaithfulness * 100) : 0,
        [runBDetails?.approachName || 'Lần chạy B']: runBDetails ? Math.round(runBDetails.ragasFaithfulness * 100) : 0,
      },
      {
        name: 'Answer Relevance',
        [runADetails?.approachName || 'Lần chạy A']: runADetails ? Math.round(runADetails.ragasAnswerRelevance * 100) : 0,
        [runBDetails?.approachName || 'Lần chạy B']: runBDetails ? Math.round(runBDetails.ragasAnswerRelevance * 100) : 0,
      },
      {
        name: 'Context Precision',
        [runADetails?.approachName || 'Lần chạy A']: runADetails ? Math.round(runADetails.ragasContextPrecision * 100) : 0,
        [runBDetails?.approachName || 'Lần chạy B']: runBDetails ? Math.round(runBDetails.ragasContextPrecision * 100) : 0,
      },
      {
        name: 'Context Recall',
        [runADetails?.approachName || 'Lần chạy A']: runADetails ? Math.round(runADetails.ragasContextRecall * 100) : 0,
        [runBDetails?.approachName || 'Lần chạy B']: runBDetails ? Math.round(runBDetails.ragasContextRecall * 100) : 0,
      }
    ];
  };

  return (
    <div className="space-y-6 w-full pb-10">
      <div>
        <h1 className="text-2xl font-semibold">Đánh Giá Chất Lượng RAG (Ragas Benchmark)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Thiết lập Golden Dataset, chạy đánh giá tự động bằng thư viện Ragas và mô hình trọng tài Gemini 2.5 Flash, so sánh hiệu năng của các hướng tiếp cận khác nhau.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] border border-border/80 p-0.5 rounded-lg bg-muted">
          <TabsTrigger value="comparison" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-none">So Sánh & Kết Quả</TabsTrigger>
          <TabsTrigger value="dataset" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:border-none">Golden Dataset</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6 mt-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chạy Benchmark Mới */}
            <BorderedCard
              className="relative md:col-span-1"
              title="Chạy Benchmark Mới"
              description="Nhập nhãn định dạng hướng tiếp cận để thực thi đánh giá."
            >
              {runningBenchmark && <BorderBeam borderWidth={1.5} size={150} duration={8} />}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Tên hướng tiếp cận / Cấu hình</label>
                  <Input 
                    placeholder="Ví dụ: With_Image_Filtering" 
                    value={approachName}
                    onChange={(e) => setApproachName(e.target.value)}
                    disabled={runningBenchmark}
                    className="border-border/80 bg-background"
                  />
                </div>
                <Button 
                  className="w-full cursor-pointer flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90" 
                  onClick={handleRunBenchmark}
                  disabled={runningBenchmark}
                >
                  {runningBenchmark ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Đang xử lý (Ragas)...
                    </>
                  ) : (
                    <>
                      <Play className="size-4" />
                      Bắt đầu Đánh giá
                    </>
                  )}
                </Button>
                <div className="text-[11px] text-muted-foreground flex items-start gap-1.5 bg-muted/50 p-2.5 rounded-md border border-border/80">
                  <AlertCircle className="size-4 text-yellow-500 shrink-0 mt-0.5" />
                  <span>
                    Hệ thống sẽ chạy từng câu hỏi trong Golden Dataset, truy xuất ngữ cảnh và gọi Gemini để sinh câu trả lời. Sau đó Ragas sẽ chấm điểm các chỉ số.
                  </span>
                </div>
              </div>
            </BorderedCard>

            {/* Chọn Cấu Hình So Sánh */}
            <BorderedCard
              className="md:col-span-2"
              title="Cấu hình So Sánh Đối Chiếu"
              description="Chọn hai lượt chạy benchmark khác nhau để phân tích hiệu suất và chất lượng."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Lượt chạy A (Trước / Baseline)</label>
                  <Select value={selectedRunAId} onValueChange={(val) => setSelectedRunAId(val || '')}>
                    <SelectTrigger className="w-full h-9 border-border/80 bg-background text-sm">
                      <SelectValue placeholder="-- Chọn lượt chạy A --" />
                    </SelectTrigger>
                    <SelectContent>
                      {dropdownHistory.map((run) => (
                        <SelectItem key={`a-${run.id}`} value={run.id.toString()}>
                          {run.approachName} ({new Date(run.runAt).toLocaleDateString()} - {run.avgLatencyMs}ms)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Lượt chạy B (Sau / Optimized)</label>
                  <Select value={selectedRunBId} onValueChange={(val) => setSelectedRunBId(val || '')}>
                    <SelectTrigger className="w-full h-9 border-border/80 bg-background text-sm">
                      <SelectValue placeholder="-- Chọn lượt chạy B --" />
                    </SelectTrigger>
                    <SelectContent>
                      {dropdownHistory.map((run) => (
                        <SelectItem key={`b-${run.id}`} value={run.id.toString()}>
                          {run.approachName} ({new Date(run.runAt).toLocaleDateString()} - {run.avgLatencyMs}ms)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!runADetails && !runBDetails && (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border/80 rounded-lg mt-6 bg-muted/20">
                  <BarChart2 className="size-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm">Vui lòng chọn các lượt chạy ở trên để hiển thị biểu đồ đối chiếu.</p>
                </div>
              )}
            </BorderedCard>
          </div>

          {/* Biểu Đồ & Bảng Số Liệu So Sánh */}
          {(runADetails || runBDetails) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Biểu đồ Recharts */}
              <BorderedCard
                title="So Sánh Điểm Chỉ Số Ragas (%)"
                headerClassName="pb-3"
                contentClassName="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: 'var(--radius-md)' }} />
                    <Legend />
                    {runADetails && <Bar dataKey={runADetails.approachName} fill="oklch(0.604 0.26 302)" radius={[4, 4, 0, 0]} />}
                    {runBDetails && <Bar dataKey={runBDetails.approachName} fill="oklch(0.696 0.165 251)" radius={[4, 4, 0, 0]} />}
                  </BarChart>
                </ResponsiveContainer>
              </BorderedCard>

              {/* Bảng so sánh tổng quan */}
              <BorderedCard
                title="So Sánh Các Chỉ Số Tóm Tắt"
                headerClassName="pb-3"
                contentClassName="pt-2"
              >
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/80">
                      <TableHead>Chỉ số</TableHead>
                      <TableHead>{runADetails?.approachName || 'Lượt chạy A'}</TableHead>
                      <TableHead>{runBDetails?.approachName || 'Lượt chạy B'}</TableHead>
                      <TableHead>Chênh lệch</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Faithfulness */}
                    <TableRow className="border-b border-border/80">
                      <TableCell className="font-medium text-sm">Faithfulness (Độ trung thực)</TableCell>
                      <TableCell>{runADetails ? `${Math.round(runADetails.ragasFaithfulness * 100)}%` : '-'}</TableCell>
                      <TableCell>{runBDetails ? `${Math.round(runBDetails.ragasFaithfulness * 100)}%` : '-'}</TableCell>
                      <TableCell>
                        {runADetails && runBDetails ? (
                          <span className={runBDetails.ragasFaithfulness >= runADetails.ragasFaithfulness ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                            {runBDetails.ragasFaithfulness >= runADetails.ragasFaithfulness ? '+' : ''}
                            {Math.round((runBDetails.ragasFaithfulness - runADetails.ragasFaithfulness) * 100)}%
                          </span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>

                    {/* Answer Relevance */}
                    <TableRow className="border-b border-border/80">
                      <TableCell className="font-medium text-sm">Answer Relevance (Hợp lẽ)</TableCell>
                      <TableCell>{runADetails ? `${Math.round(runADetails.ragasAnswerRelevance * 100)}%` : '-'}</TableCell>
                      <TableCell>{runBDetails ? `${Math.round(runBDetails.ragasAnswerRelevance * 100)}%` : '-'}</TableCell>
                      <TableCell>
                        {runADetails && runBDetails ? (
                          <span className={runBDetails.ragasAnswerRelevance >= runADetails.ragasAnswerRelevance ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                            {runBDetails.ragasAnswerRelevance >= runADetails.ragasAnswerRelevance ? '+' : ''}
                            {Math.round((runBDetails.ragasAnswerRelevance - runADetails.ragasAnswerRelevance) * 100)}%
                          </span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>

                    {/* Context Precision */}
                    <TableRow className="border-b border-border/80">
                      <TableCell className="font-medium text-sm">Context Precision (Chuẩn xác)</TableCell>
                      <TableCell>{runADetails ? `${Math.round(runADetails.ragasContextPrecision * 100)}%` : '-'}</TableCell>
                      <TableCell>{runBDetails ? `${Math.round(runBDetails.ragasContextPrecision * 100)}%` : '-'}</TableCell>
                      <TableCell>
                        {runADetails && runBDetails ? (
                          <span className={runBDetails.ragasContextPrecision >= runADetails.ragasContextPrecision ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                            {runBDetails.ragasContextPrecision >= runADetails.ragasContextPrecision ? '+' : ''}
                            {Math.round((runBDetails.ragasContextPrecision - runADetails.ragasContextPrecision) * 100)}%
                          </span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>

                    {/* Context Recall */}
                    <TableRow className="border-b border-border/80">
                      <TableCell className="font-medium text-sm">Context Recall (Độ phủ)</TableCell>
                      <TableCell>{runADetails ? `${Math.round(runADetails.ragasContextRecall * 100)}%` : '-'}</TableCell>
                      <TableCell>{runBDetails ? `${Math.round(runBDetails.ragasContextRecall * 100)}%` : '-'}</TableCell>
                      <TableCell>
                        {runADetails && runBDetails ? (
                          <span className={runBDetails.ragasContextRecall >= runADetails.ragasContextRecall ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                            {runBDetails.ragasContextRecall >= runADetails.ragasContextRecall ? '+' : ''}
                            {Math.round((runBDetails.ragasContextRecall - runADetails.ragasContextRecall) * 100)}%
                          </span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>

                    {/* Latency */}
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="font-medium text-sm flex items-center gap-1.5 border-none">
                        <Clock className="size-3.5 text-muted-foreground" />
                        Thời gian phản hồi TB
                      </TableCell>
                      <TableCell className="border-none">{runADetails ? `${(runADetails.avgLatencyMs / 1000).toFixed(2)}s` : '-'}</TableCell>
                      <TableCell className="border-none">{runBDetails ? `${(runBDetails.avgLatencyMs / 1000).toFixed(2)}s` : '-'}</TableCell>
                      <TableCell className="border-none">
                        {runADetails && runBDetails ? (
                          <span className={runBDetails.avgLatencyMs <= runADetails.avgLatencyMs ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                            {runBDetails.avgLatencyMs > runADetails.avgLatencyMs ? '+' : ''}
                            {((runBDetails.avgLatencyMs - runADetails.avgLatencyMs) / 1000).toFixed(2)}s
                          </span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </BorderedCard>
            </div>
          )}

          {/* Chi Tiết Từng Câu Hỏi Đối Chiếu */}
          {runADetails && runBDetails && (
            <BorderedCard
              title="Đối Chiếu Chi Tiết Từng Câu Hỏi"
              description="So sánh câu trả lời sinh ra và điểm số của từng câu hỏi riêng biệt (Click vào tiêu đề để mở rộng/thu gọn)."
              headerClassName="pb-3"
            >
              {runADetails.details?.map((detailA, index) => {
                const detailB = runBDetails.details?.[index];
                const isExpanded = expandedQuestions[index];

                return (
                  <div key={`compare-q-${index}`} className="border border-border/80 rounded-lg bg-muted/30 overflow-hidden transition-all duration-200">
                    {/* Accordion Trigger Header */}
                    <div 
                      className="flex flex-wrap items-center justify-between gap-4 p-4 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => toggleQuestion(index)}
                    >
                      <div className="flex items-center gap-3 min-w-[200px] flex-1">
                        <span className="font-semibold text-xs text-foreground bg-primary/10 text-primary px-2.5 py-1 rounded-md shrink-0">
                          Câu {index + 1}
                        </span>
                        <p className="font-medium text-sm text-foreground truncate max-w-md md:max-w-xl">
                          {detailA.question}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium shrink-0">
                        <div className="flex gap-2">
                          <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                            A: {Math.round(detailA.faithfulness * 100)}% | {Math.round(detailA.answerRelevance * 100)}%
                          </span>
                          {detailB && (
                            <span className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 px-2 py-0.5 rounded border border-green-200 dark:border-green-800">
                              B: {Math.round(detailB.faithfulness * 100)}% | {Math.round(detailB.answerRelevance * 100)}%
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs">{isExpanded ? "Thu gọn ▲" : "Chi tiết ▼"}</span>
                      </div>
                    </div>

                    {/* Accordion Expanded Content */}
                    {isExpanded && (
                      <div className="p-4 border-t border-border/80 bg-background space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="bg-muted/40 p-3 rounded-md border border-border/80">
                          <h5 className="text-xs font-bold text-muted-foreground mb-1">CÂU HỎI KIỂM THỬ:</h5>
                          <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{detailA.question}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Run A Answer */}
                          <div className="space-y-2 p-3 rounded-md border border-border/80 bg-card">
                            <div className="flex justify-between items-center border-b border-border/80 pb-2 mb-2">
                              <h4 className="text-xs font-bold text-purple-600">{runADetails.approachName} (A)</h4>
                              <span className="text-[10px] text-muted-foreground">Latency: {(detailA.latencyMs / 1000).toFixed(2)}s</span>
                            </div>
                            <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">{detailA.generatedAnswer}</p>
                            
                            <div className="grid grid-cols-4 gap-1 pt-3 border-t border-border/80 text-[10px] font-medium text-muted-foreground text-center">
                              <div className="bg-muted py-0.5 rounded">Faith: {Math.round(detailA.faithfulness * 100)}%</div>
                              <div className="bg-muted py-0.5 rounded">Relev: {Math.round(detailA.answerRelevance * 100)}%</div>
                              <div className="bg-muted py-0.5 rounded">Prec: {Math.round(detailA.contextPrecision * 100)}%</div>
                              <div className="bg-muted py-0.5 rounded">Recall: {Math.round(detailA.contextRecall * 100)}%</div>
                            </div>

                            {detailA.retrievedContexts && (
                              <div className="mt-3 pt-2 border-t border-border/80">
                                <span className="text-[10px] font-bold text-muted-foreground block mb-1">Ngữ cảnh truy xuất:</span>
                                <p className="text-[10px] text-muted-foreground max-h-24 overflow-y-auto whitespace-pre-wrap bg-muted/40 p-2 rounded leading-normal">{detailA.retrievedContexts}</p>
                              </div>
                            )}
                          </div>

                          {/* Run B Answer */}
                          {detailB ? (
                            <div className="space-y-2 p-3 rounded-md border border-border/80 bg-card">
                              <div className="flex justify-between items-center border-b border-border/80 pb-2 mb-2">
                                <h4 className="text-xs font-bold text-green-600">{runBDetails.approachName} (B)</h4>
                                <span className="text-[10px] text-muted-foreground">Latency: {(detailB.latencyMs / 1000).toFixed(2)}s</span>
                              </div>
                              <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">{detailB.generatedAnswer}</p>
                              
                              <div className="grid grid-cols-4 gap-1 pt-3 border-t border-border/80 text-[10px] font-medium text-muted-foreground text-center">
                                <div className="bg-muted py-0.5 rounded">Faith: {Math.round(detailB.faithfulness * 100)}%</div>
                                <div className="bg-muted py-0.5 rounded">Relev: {Math.round(detailB.answerRelevance * 100)}%</div>
                                <div className="bg-muted py-0.5 rounded">Prec: {Math.round(detailB.contextPrecision * 100)}%</div>
                                <div className="bg-muted py-0.5 rounded">Recall: {Math.round(detailB.contextRecall * 100)}%</div>
                              </div>

                              {detailB.retrievedContexts && (
                                <div className="mt-3 pt-2 border-t border-border/80">
                                  <span className="text-[10px] font-bold text-muted-foreground block mb-1">Ngữ cảnh truy xuất:</span>
                                  <p className="text-[10px] text-muted-foreground max-h-24 overflow-y-auto whitespace-pre-wrap bg-muted/40 p-2 rounded leading-normal">{detailB.retrievedContexts}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center border border-dashed border-border/80 rounded-md bg-muted/10 text-xs text-muted-foreground p-6">
                              Không có dữ liệu cho cấu hình B
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </BorderedCard>
          )}

          {/* Lịch Sử Các Lượt Chạy Benchmark */}
          <BorderedCard
            title="Lịch Sử Lượt Chạy Benchmark"
            description="Danh sách các cấu hình thử nghiệm và điểm Ragas tích lũy (Phân trang)."
            contentClassName="pt-0"
          >
            <CrudTable<BenchmarkRun>
              columns={benchmarkRunColumns(handleSelectA, handleSelectB, handleDeleteRun, selectedRunAId, selectedRunBId)}
              useQuery={useBenchmarkHistoryQuery}
              filterPlaceholder="Lọc theo hướng tiếp cận..."
            />
          </BorderedCard>
        </TabsContent>

        <TabsContent value="dataset" className="space-y-6 mt-4 animate-in fade-in duration-200">
          {/* Golden Dataset (Tập Dữ Liệu Kiểm Thử) */}
          <BorderedCard
            title="Golden Dataset (Tập Dữ Liệu Kiểm Thử)"
            description="Quản lý tập câu hỏi và đáp án mẫu chuẩn (Ground Truth) dùng để chạy Benchmark đánh giá."
            contentClassName="pt-0"
            action={
              <Button onClick={handleOpenAddDialog} className="cursor-pointer flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="size-4" />
                Thêm Câu Hỏi
              </Button>
            }
          >
            <CrudTable<BenchmarkQuestion>
              columns={benchmarkQuestionColumns(handleOpenEditDialog, handleDeleteQuestion)}
              useQuery={useBenchmarkQuestionsQuery}
              filterPlaceholder="Lọc theo câu hỏi hoặc đáp án..."
            />
          </BorderedCard>
        </TabsContent>
      </Tabs>

      {/* Add / Edit Question Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[550px] border border-border/80 bg-card rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editingQuestion ? 'Cập Nhật Câu Hỏi Đánh Giá' : 'Thêm Câu Hỏi Đánh Giá Mới'}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Nhập câu hỏi học thuật và đáp án chuẩn tương ứng của tài liệu để Ragas có cơ sở chấm điểm chất lượng câu trả lời.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Câu hỏi kiểm thử</label>
              <Textarea 
                placeholder="Nhập câu hỏi người dùng sẽ đặt..." 
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
                className="border-border/80 bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Đáp án chuẩn (Ground Truth)</label>
              <Textarea 
                placeholder="Nhập câu trả lời chính xác làm cơ sở đối chiếu..." 
                value={groundTruthText}
                onChange={(e) => setGroundTruthText(e.target.value)}
                rows={4}
                className="border-border/80 bg-background"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenDialog(false)} className="cursor-pointer border-border/80">
              Hủy
            </Button>
            <Button onClick={handleSaveQuestion} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
