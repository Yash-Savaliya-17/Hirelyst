import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface userState {
    name: string,
    email: string,
    sys_id: number,
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    profileImage?: string | null;
}

interface authState {
    status: boolean
    user: userState | null
}

const initialState: authState = {
    status: false,
    user: null
}


const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        addUser: (state, action: PayloadAction<userState>) => {
            state.status = true;
            state.user = action.payload;
        },
        removeUser: (state) => {
            state.status = false;
            state.user = null;
        }
    }
})

export const { addUser, removeUser } = authSlice.actions;
export type { userState as UserDataType, authState as AuthDataType };
export default authSlice.reducer;
