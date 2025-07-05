import networkvideo from "../assets/networkvideo.mp4";
import secureauth from "../assets/secureauth.mp4";
const HeroSection = () => {
    return(
        <div className="flex flex-col items-center mt-6 lg:mt-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl text-center tracking-wide font-sans">GuardianGrid Your 
                <span className="bg-gradient-to-r from-green-300 to-cyan-500 text-transparent bg-clip-text"> Shield in Uncertain Times</span>
            </h1>
            <p className="mt-10 font-sans text-xl text-neutral-500 max-w-3xl">
                Stay informed, find safety, and understand history. Connecting communities with vital 
                information for war and calamity preparedness.
            </p>
            <div className="lg:flex mt-10 justify-center ">
                <video autoPlay loop muted className="rounded-md w-3/4 border border-cyan-300 mx-2 my-4">
                    <source src={networkvideo} type="video/mp4" />
                    your browser does not support the video tag.
                </video>
                <video autoPlay loop muted className="rounded-md w-1/2 border border-cyan-300 mx-2 my-4">
                    <source src={secureauth} type="video/mp4" />
                    your browser does not support the video tag.
                </video>
            </div>
        </div>
    )
};
export {HeroSection};