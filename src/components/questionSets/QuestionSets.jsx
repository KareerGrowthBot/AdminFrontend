import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Search, BookOpen } from "lucide-react";
import { questionSetService } from "../../services/questionSetService";
import { positionService } from "../../services/positionService";
import QuestionSetForm from "./QuestionSetForm";

const QuestionSets = () => {
  const navigate = useNavigate();
  const [questionSets, setQuestionSets] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestionSet, setEditingQuestionSet] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current && !isLoadingRef.current) {
      loadData();
    }
  }, []);

  const loadData = async (forceReload = false) => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }

    // Don't reload if data already exists and not forcing reload
    if (!forceReload && hasLoadedRef.current && questionSets.length > 0 && positions.length > 0) {
      return;
    }

    isLoadingRef.current = true;

    try {
      setLoading(true);
      const [questionSetsData, positionsData] = await Promise.all([
        questionSetService.getAllQuestionSets(),
        positionService.getAllPositions()
      ]);
      setQuestionSets(questionSetsData);
      setPositions(positionsData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load question sets. Please try again.");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      hasLoadedRef.current = true;
    }
  };

  const handleCreate = () => {
    navigate("/dashboard/question-sets/create");
  };

  const handleEdit = (questionSet) => {
    // Navigate to CreateQuestionSet page with question set data
    // Extract only serializable data to avoid React symbol cloning errors
    const questionSetData = {
      id: questionSet.id,
      name: questionSet.name,
      description: questionSet.description,
      positionId: questionSet.positionId,
      positionCode: questionSet.positionCode,
      positionTitle: questionSet.positionTitle,
      questions: Array.isArray(questionSet.questions) ? questionSet.questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: Array.isArray(q.options) ? [...q.options] : q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks
      })) : questionSet.questions,
      createdAt: questionSet.createdAt,
      updatedAt: questionSet.updatedAt
    };
    navigate("/dashboard/question-sets/create", {
      state: {
        questionSetId: questionSet.id,
        questionSet: questionSetData,
        positionId: questionSet.positionId,
        isEditMode: true
      }
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question set?")) {
      return;
    }

    try {
      await questionSetService.deleteQuestionSet(id);
      alert("Question set deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting question set:", error);
      alert("Failed to delete question set. Please try again.");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingQuestionSet(null);
    loadData();
  };

  const getPositionTitle = (positionId) => {
    const position = positions.find(p => p.id === positionId);
    return position ? position.title : positionId;
  };

  const filteredQuestionSets = questionSets.filter((qs) =>
    qs.questionSetCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getPositionTitle(qs.positionId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qs.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">Question Set Management</h1>
          <p className="text-gray-600 mt-1">Manage question sets for positions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-navy-900 text-white rounded-lg hover:bg-navy-800 flex items-center gap-2"
          >
            <Plus size={18} />
            Create Question Set
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search question sets by code, position, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Question Sets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question Set Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Questions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration (min)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complexity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuestionSets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No question sets found. Create your first question set to get started.
                  </td>
                </tr>
              ) : (
                filteredQuestionSets.map((questionSet) => (
                  <tr key={questionSet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-navy-600" />
                        {questionSet.questionSetCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPositionTitle(questionSet.positionId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {questionSet.totalQuestions || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {questionSet.totalDuration || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${questionSet.complexityLevel === "HARD"
                            ? "bg-red-100 text-red-800"
                            : questionSet.complexityLevel === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                      >
                        {questionSet.complexityLevel || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${questionSet.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : questionSet.status === "INACTIVE"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {questionSet.status || "DRAFT"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      v{questionSet.version || 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(questionSet)}
                          className="text-navy-600 hover:text-navy-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(questionSet.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Question Set Modal - Only show when editing existing question set */}
      {showForm && editingQuestionSet && (
        <QuestionSetForm
          positionId={editingQuestionSet?.positionId || null}
          questionSet={editingQuestionSet}
          onClose={handleFormClose}
          onSuccess={handleFormClose}
        />
      )}
    </div>
  );
};

export default QuestionSets;

