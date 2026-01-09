import { useState } from "react";

export default function TelegramTest() {
    const [response, setResponse] = useState(null);

    const testLogin = async () => {
        // Dummy Telegram data
        const dummyUser = {
            id: 123456789,
            username: "testuser",
            first_name: "Maftuna",
            photo_url: "https://via.placeholder.com/150",
            hash: "dummyhash" // This will fail hash verification, but okay for testing request
        };

        try {
            const res = await fetch("http://localhost:4000/api/auth/telegram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dummyUser)
            });

            const data = await res.json();
            setResponse(data);
        } catch (err) {
            console.error(err);
            setResponse({ error: "Request failed" });
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-2">Test Telegram Login POST</h2>
            <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={testLogin}
            >
                Send Test POST
            </button>

            {response && (
                <pre className="mt-4 p-2 bg-gray-100 rounded">
          {JSON.stringify(response, null, 2)}
        </pre>
            )}
        </div>
    );
}
