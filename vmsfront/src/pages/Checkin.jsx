import React, { useState, useRef, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createOrUpdateVisitor,
  createVisit,
  getVisitorByPhone
} from "@/lib/api";

export default function CheckIn({ setScreen }) {

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [purpose, setPurpose] = useState("Official");
  const [person, setPerson] = useState("");

  const [loadingVisitor, setLoadingVisitor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [photoFile, setPhotoFile] = useState(null);

  const phoneRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const purposes = ["Official", "Personal", "Interview", "Delivery"];

  useEffect(() => {
    phoneRef.current?.focus();
  }, []);

  // Start camera
  useEffect(() => {

    startCamera();

    return () => {
      stopCamera();
    };

  }, []);

  const startCamera = async () => {

    try {

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

    } catch (error) {
      console.error("Camera error:", error);
    }

  };

  const stopCamera = () => {

    if (streamRef.current) {

      streamRef.current.getTracks().forEach(track => track.stop());

      streamRef.current = null;

    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

  };

  // Autofill visitor
  useEffect(() => {

    if (phone.length < 8) return;

    setLoadingVisitor(true);

    const timer = setTimeout(async () => {

      try {

        const visitor = await getVisitorByPhone(phone);

        setName(prev => prev || visitor.name);
        setCompany(prev => prev || visitor.company || "");

      } catch {}

      setLoadingVisitor(false);

    }, 400);

    return () => clearTimeout(timer);

  }, [phone]);

  const capturePhoto = async () => {

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, "image/jpeg", 0.7)
    );

    const file = new File([blob], "visitor.jpg", { type: "image/jpeg" });

    const compressed = await imageCompression(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 640,
      useWebWorker: true
    });

    setPhotoFile(compressed);

  };

  const handleSubmit = async () => {

    if (!phone || !name || !person) {
      alert("Please fill required fields");
      return;
    }

    if (phone.length !== 10) {
      alert("Phone number must be 10 digits");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {

      await createOrUpdateVisitor({ phone, name, company });

      const formData = new FormData();

      formData.append("phone", phone);
      formData.append("name", name);
      formData.append("company", company);
      formData.append("purpose", purpose);
      formData.append("personToMeet", person);

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      await createVisit(formData);

      setMessage("Checked in successfully.");

      setPhone("");
      setName("");
      setCompany("");
      setPerson("");
      setPurpose("Official");
      setPhotoFile(null);

      phoneRef.current?.focus();

    } catch (error) {

      setMessage(error.message || "Unable to check in.");

    } finally {

      setSubmitting(false);

    }

  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6">

      <Card className="w-full max-w-6xl rounded-3xl shadow-2xl">

        <CardContent className="p-10">

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Visitor Check-In</h2>

            <Button variant="outline" onClick={() => setScreen("home")}>
              Back
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-10">

            {/* LEFT SIDE FORM */}

            <div className="space-y-5">

              <Input
                ref={phoneRef}
                placeholder="Phone Number"
                value={phone}
                maxLength={10}
                inputMode="numeric"
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                className="text-xl p-5"
              />

              {loadingVisitor && (
                <p className="text-sm text-gray-500">
                  Fetching visitor details...
                </p>
              )}

              <Input
                placeholder="Visitor Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xl p-5"
              />

              <Input
                placeholder="Company (optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="text-xl p-5"
              />

              <Input
                placeholder="Person to Meet"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="text-xl p-5"
              />

              <div>

                <p className="text-gray-600 mb-2">Purpose of Visit</p>

                <div className="grid grid-cols-2 gap-3">

                  {purposes.map((p) => (

                    <Button
                      key={p}
                      variant={purpose === p ? "default" : "outline"}
                      className="h-14 text-lg rounded-xl"
                      onClick={() => setPurpose(p)}
                    >
                      {p}
                    </Button>

                  ))}

                </div>

              </div>

              <Button
                className="w-full h-16 text-2xl rounded-xl"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Checking In..." : "Check In"}
              </Button>

              {message && (
                <p className="text-center text-gray-600">{message}</p>
              )}

            </div>

            {/* RIGHT SIDE CAMERA */}

            <div className="flex flex-col items-center justify-center gap-6 bg-gray-50 p-6 rounded-xl">

              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-xl border object-cover"
              />

              <Button
                variant="outline"
                className="h-14 text-lg"
                onClick={capturePhoto}
              >
                Capture Photo
              </Button>

              <p className="text-sm text-gray-500">
                {photoFile ? "Photo captured ✓" : "No photo yet"}
              </p>

              <canvas ref={canvasRef} style={{ display: "none" }} />

            </div>

          </div>

        </CardContent>

      </Card>

    </div>

  );

}