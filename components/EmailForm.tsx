"use client";

import { useState, useEffect } from "react";
import { FiMail, FiX, FiCheck, FiLoader } from "react-icons/fi";

interface EmailFormProps {
  studentEmail: string;
  onClose?: () => void;
  isSingleEmail?: boolean;
}

const EmailForm = ({ studentEmail, onClose, isSingleEmail = false }: EmailFormProps) => {
  const [email, setEmail] = useState(studentEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ type: 'idle' | 'sending' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  useEffect(() => {
    setEmail(studentEmail);
  }, [studentEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'sending', message: 'Sending email...' });

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, subject, message }),
      });

      const result = await response.json();
      if (result.success) {
        setStatus({ type: 'success', message: 'Email sent successfully!' });
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      } else {
        setStatus({ type: 'error', message: 'Failed to send email.' });
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus({ type: 'error', message: 'Error sending email.' });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FiMail className="text-blue-600" /> 
          {isSingleEmail ? "Send Email" : "Bulk Email"}
        </h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <FiX size={20} />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient(s)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            multiple={!isSingleEmail}
            className="w-full p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            placeholder="Write your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
            className="w-full p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex justify-end gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={status.type === 'sending'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-70"
          >
            {status.type === 'sending' ? (
              <>
                <FiLoader className="animate-spin" /> Sending...
              </>
            ) : (
              <>
                <FiMail /> Send
              </>
            )}
          </button>
        </div>
      </form>

      {status.type !== 'idle' && (
        <div className={`mt-4 p-3 rounded-md ${
          status.type === 'success' ? 'bg-green-100 text-green-800' :
          status.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        } flex items-center gap-2`}>
          {status.type === 'success' ? <FiCheck /> : 
           status.type === 'error' ? <FiX /> : <FiLoader className="animate-spin" />}
          {status.message}
        </div>
      )}
    </div>
  );
};

export default EmailForm;