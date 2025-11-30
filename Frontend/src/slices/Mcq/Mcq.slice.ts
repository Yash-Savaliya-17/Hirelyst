import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Option {
  sys_id: string;
  option: string;
}

interface Question {
  sys_id: string;
  question: {
    question: string;
    options: Option[];
  };
  questionId: string;
}

export interface McqState {
  id?: number;
  title: string;
  questions: Question[];
  startsAt: string;
  endsAt: string;
}

const initialState: McqState = {
  title: '',
  questions: [],
  id: undefined,
  startsAt: '',
  endsAt: ''
};

const mcqSlice = createSlice({
  name: 'mcq',
  initialState,
  reducers: {
    addQuestions: (state, action: PayloadAction<McqState>) => {
      state.id = action.payload.id;
      state.title = action.payload.title;
      state.startsAt = action.payload.startsAt;
      state.endsAt = action.payload.endsAt;
      state.questions = action.payload.questions;
    },
    resetQuizState: () => initialState
  }
});

export const { addQuestions, resetQuizState } = mcqSlice.actions;
export default mcqSlice.reducer;
