import React from 'react';

const Careers: React.FC = () => {
    const jobOpenings = [
        {
            title: "Senior AI/ML Engineer (Generative Models)",
            location: "Remote",
            department: "Engineering",
            description: "We are looking for an experienced AI engineer to help us push the boundaries of generative AI in sports analytics. You will be responsible for designing, training, and deploying next-generation predictive models using the latest Gemini capabilities."
        },
        {
            title: "Lead Frontend Engineer (React & TypeScript)",
            location: "Remote",
            department: "Engineering",
            description: "Join our team to lead the development of our user-facing platform. You will be building highly interactive, real-time data visualizations and ensuring a world-class user experience on our React-based application."
        },
        {
            title: "Product Marketing Manager",
            location: "Remote",
            department: "Marketing",
            description: "We're seeking a creative and data-driven product marketer to own the go-to-market strategy for our platform. You'll be responsible for messaging, positioning, and driving adoption of our cutting-edge AI tools."
        }
    ];

    return (
        <div className="py-16 md:py-24 max-w-4xl mx-auto">
            <header className="text-center">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight">
                    Join Our Team
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400">
                    We're building the future of sports analytics. If you're passionate about AI, data, and horse racing, we'd love to have you on board.
                </p>
            </header>
            <div className="mt-16 space-y-8">
                {jobOpenings.map((job, index) => (
                    <div key={index} className="bg-white dark:bg-[#161B22] p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:border-blue-500 hover:shadow-xl">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{job.title}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{job.department} &middot; {job.location}</p>
                            </div>
                            <a href="#" className="mt-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                                Apply Now
                            </a>
                        </div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">{job.description}</p>
                    </div>
                ))}
                 <div className="text-center p-6 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300">Don't see a role that fits? We're always looking for talented people. <a href="#" className="font-semibold text-blue-600 hover:underline">Get in touch</a>.</p>
                </div>
            </div>
        </div>
    );
};

export default Careers;
