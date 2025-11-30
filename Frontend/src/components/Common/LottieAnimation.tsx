import { lineWobble } from 'ldrs'
lineWobble.register()

export const LottieAnimation = () => {
    return (
        <div className='w-full flex  items-center justify-center'>
            <l-line-wobble
                size="130"
                stroke="5"
                bg-opacity="0.1"
                speed="1.75"
                color="#0284c7"
            ></l-line-wobble>
        </div>
    )
}