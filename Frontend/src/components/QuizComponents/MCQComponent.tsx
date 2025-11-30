import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/slices/store';
import { SubmitResponse } from '@/services/operations/QuizOperations';
import Timer from './Timer';
import { toast } from 'sonner';
import { Button } from '@/components/Common/shadcnui/button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const MCQComponent: React.FC = () => {
  const navigate = useNavigate();
  const quiz = useSelector((state: RootState) => state.mcq);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number | null }>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [visitedQuestions, setVisitedQuestions] = useState<number[]>([]);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);

  const handleAnswerSelect = (index: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: index }));
  };

  const submitResponse = async (status: 'SAVED' | 'SUBMITTED') => {
    setIsQuestionLoading(true);
    try {
      const currentQues = quiz.questions[currentQuestion];
      const questionId = currentQues.sys_id;
      const selectedAnswer = answers[currentQuestion];

      const data = {
        response: selectedAnswer !== null
          ? String.fromCharCode(65 + selectedAnswer)
          : null,
        status,
      };
      await SubmitResponse(quiz.id, questionId, { ...data, status: 'SAVED' });

      if (status === 'SUBMITTED') {
        toast.success('Quiz Submitted Successfully');
        navigate('/');
        return;
      }

      if (!answeredQuestions.includes(currentQuestion)) {
        setAnsweredQuestions((prev) => [...prev, currentQuestion]);
      }

      setCurrentQuestion((prev) => (prev + 1) % quiz.questions.length);
    } catch (error) {
      toast.error('Failed to submit response');
      console.error('Response submission error:', error);
    } finally {
      setIsQuestionLoading(false);
    }
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'prev'
        ? (currentQuestion - 1 + quiz.questions.length) % quiz.questions.length
        : (currentQuestion + 1) % quiz.questions.length;

    setCurrentQuestion(newIndex);

    if (!visitedQuestions.includes(newIndex)) {
      setVisitedQuestions((prev) => [...prev, newIndex]);
    }
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestion(index);

    if (!visitedQuestions.includes(index)) {
      setVisitedQuestions((prev) => [...prev, index]);
    }
  };

  return (
    <div className="min-h-screen font-manrope bg-gray-100 flex flex-col">
      {/* Quiz Header */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <Timer startsAt={quiz.startsAt} endsAt={quiz.endsAt} />
      </header>

      {/* Main Quiz Content */}
      <main className="flex flex-1 p-6">
        {/* Question Navigation */}
        <aside className="w-1/4 pr-4">
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => handleQuestionSelect(index)}
                className={`w-10 h-10 rounded-full ${
                  currentQuestion === index
                    ? 'bg-blue-500 text-white'
                    : answeredQuestions.includes(index)
                    ? 'bg-green-500 text-white'
                    : visitedQuestions.includes(index)
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </aside>

        {/* Question Content */}
        <section className="w-3/4 pl-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </h2>

            <p className="text-lg mb-6 font-semibold">
              {quiz.questions[currentQuestion].question.question}
            </p>

            <div className="space-y-4">
              {quiz.questions[currentQuestion].question.options.map(
                (option: any, index: number) => (
                  <label
                    key={index}
                    className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                      answers[currentQuestion] === index
                        ? 'bg-blue-100 border-blue-500'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={index}
                      checked={answers[currentQuestion] === index}
                      onChange={() => handleAnswerSelect(index)}
                      className="mr-3"
                    />
                    {option.option}
                  </label>
                )
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={() => handleNavigation('prev')}
              disabled={isQuestionLoading}
            >
              <ChevronLeft className="mr-2" /> Previous
            </Button>

            {currentQuestion === quiz.questions.length - 1 ? (
              <Button
                onClick={() => submitResponse('SUBMITTED')}
                disabled={isQuestionLoading}
              >
                <Check className="mr-2" /> Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={() => submitResponse('SAVED')}
                disabled={isQuestionLoading}
              >
                Save & Next <ChevronRight className="ml-2" />
              </Button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MCQComponent;
