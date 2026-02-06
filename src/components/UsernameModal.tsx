import { useState } from "react";
import { motion } from "motion/react";

type Props = {
    onSubmit: (username: string) => void;
};

function UsernameModal({ onSubmit }: Props) {
    const [value, setValue] = useState("");

    const isValid = value.trim().length > 0;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                className="w-full max-w-xl rounded-2xl bg-white p-6"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                <h2 className="text-[1.375rem] font-bold">Welcome to CodeLeap network!</h2>

                <form
                    className="mt-4 flex flex-col gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (isValid) {
                            const username = value.trim();
                            localStorage.setItem("username", username);
                            onSubmit(username);
                        }
                    }}
                >
                    <fieldset className="flex flex-col gap-1">
                        <label htmlFor="username" className="text-sm">
                            Please enter your username
                        </label>
                        <input
                            id="username"
                            value={value}
                            onChange={(e) => setValue(e.target.value.replace(/\s/g, ""))}
                            placeholder="JohnDoe"
                            className="border border-customgrey text-sm rounded-lg py-2 px-3"
                            autoFocus
                        />
                    </fieldset>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={!isValid}
                            className="bg-customblue text-secondary font-bold text-sm uppercase tracking-wide py-2 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Enter
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

export default UsernameModal;