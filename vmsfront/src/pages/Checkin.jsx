import React, { useState, useRef, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createOrUpdateVisitor, createVisit, getVisitorByPhone } from "@/lib/api";

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

  const purposes = ["Official", "Personal", "Interview", "Delivery"];

  useEffect(() => {
    phoneRef.current?.focus();
  }, []);

  // Start camera
  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  // Autofill visitor
  useEffect(() => {

    if (phone.length < 8) return;

    setLoadingVisitor(true);

    const timer = setTimeout(async () => {

      try {

        const visitor = await getVisitorByPhone(phone);

        setName((prev) => prev || visitor.name);
        setCompany((prev) => prev || visitor.company || "");

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

    <Card className="rounded-2xl shadow-lg">

      <CardContent className="p-6 space-y-4">

        <Button variant="outline" onClick={() => setScreen("home")}>
          Back
        </Button>

        <h2 className="text-2xl font-semibold">Visitor Check-In</h2>

        {/* PHONE */}

        <Input
          ref={phoneRef}
          placeholder="Enter Phone Number"
          value={phone}
          maxLength={10}
          inputMode="numeric"
          onChange={(e) =>
            setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          className="text-lg p-4"
        />

        {loadingVisitor && (
          <p className="text-sm text-gray-500">Fetching visitor...</p>
        )}

        {/* NAME */}

        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-lg p-4"
        />

        {/* COMPANY */}

        <Input
          placeholder="Company (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="text-lg p-4"
        />

        {/* PURPOSE */}

        <div>

          <p className="mb-2 text-sm text-gray-600">Purpose</p>

          <div className="grid grid-cols-2 gap-2">

            {purposes.map((p) => (

              <Button
                key={p}
                variant={purpose === p ? "default" : "outline"}
                onClick={() => setPurpose(p)}
                className="h-12 text-lg"
              >
                {p}
              </Button>

            ))}

          </div>

        </div>

        {/* PERSON */}

        <Input
          placeholder="Person to Meet"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          className="text-lg p-4"
        />

        {/* CAMERA ROW */}

        <div className="flex items-center gap-4">

          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-32 h-24 rounded border object-cover"
          />

          <Button
            variant="outline"
            onClick={capturePhoto}
          >
            Capture
          </Button>

          <span className="text-sm text-gray-600">
            {photoFile ? "Photo captured ✓" : "No photo"}
          </span>

          <canvas ref={canvasRef} style={{ display: "none" }} />

        </div>

        {/* SUBMIT */}

        <Button
          className="w-full h-14 text-xl"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Checking In..." : "Check In"}
        </Button>

        {message && (
          <p className="text-sm text-gray-600">{message}</p>
        )}

      </CardContent>

    </Card>
  );
}