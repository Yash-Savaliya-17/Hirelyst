import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogClose } from "@/components/Common/shadcnui/dialog";
import { Button } from "@/components/Common/shadcnui/button";
import { LottieAnimation } from "@/components/Common/LottieAnimation";
import Component from '@/assets/json/Complete.json';
import { ConfettiButton } from "@/components/Common/magicui/confetti";
import { toast } from 'sonner';
import { RegisterQuiz } from '@/services/operations/QuizOperations';

const RegisterDialog = ({ id }: { id: string }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userRegistered, setUserRegistered] = useState(false);

  const handleRegister = async () => {
    try {
      const response = await RegisterQuiz(id);
      setUserRegistered(true);
      toast.success(response.data.message);
    } catch (error: any) {
      setUserRegistered(false);
      toast.error(error.response.data.message);
    }
  };

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div className="px-6 py-4 sm:px-10 sm:py-6 flex justify-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <div className="relative">
              <ConfettiButton
                className={`bg-green-500 hover:bg-green-600 w-44 text-lg text-white ${userRegistered ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleRegister}
              >
                {userRegistered ? 'Registered' : 'Register Now'}
              </ConfettiButton>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] ">
            <h1 className="text-md font-dm-sans font-bold">
              Congratulations, you have successfully registered.
            </h1>
            <div className="flex flex-col items-center justify-center gap-4 h-36 py-8">
              <div className="w-[75%] flex justify-center">
                <LottieAnimation  />
              </div>
            </div>
            <DialogFooter>
              <div className="w-full flex mt-4  justify-center gap-x-3">
                <Button
                  type="button"
                  className="bg-green-500 hover:bg-green-600 w-36 h-12 text-lg font-dm-sans"
                >
                  Registered
                </Button>
                <DialogClose asChild>
                  <Button
                    type="button"
                    className="bg-red-500 hover:bg-red-600 w-36 h-12 text-lg font-dm-sans"
                  >
                    Cancel
                  </Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default RegisterDialog;
