const ErrorMessage = ({ children }) => {
  return (
    <div className="flex h-[calc(100vh-208px)] items-center justify-center">
      <div className="mx-5 h-fit max-w-230 rounded-lg border-2 border-dashed border-red-600 bg-red-600/30 p-3 text-center text-lg text-red-600">
        {children}
      </div>
    </div>
  );
};

export default ErrorMessage;
