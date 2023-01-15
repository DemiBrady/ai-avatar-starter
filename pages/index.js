import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import buildspaceLogo from '../assets/buildspace-logo.png';

const Home = () => {
  const maxRetries = 20; // should this be tabbed back one?
  const [input, setInput] = useState('');
  const[img, setImg] = useState('');
  const [retry, setRetry] = useState(0);
  const [retryCount, setRetryCount] = useState(maxRetries);
  const [isGenerating, setIsGenerating] = useState(false);
  const[finalPrompt, setFinalPrompt] = useState('');
  const onChange = (Event) => {
    setInput(Event.target.value);
  };

  // Add generateAction function
  const generateAction = async () => {
    console.log('Generating...');

    // Check to make sure there is no double click
    if (isGenerating && retry == 0) return;

    // Set loading to started
    setIsGenerating(true);

    // If this is a retry request, take away retryCount
    if (retry > 0) {
      setRetryCount((prevState) => {
        if (prevState === 0) {
          return 0;
        } else {
          return prevState - 1;
        }
      });

      setRetry(0);
    }

    // Replace function for Demetra > derobr
    const finalInput = input.replace(/demetra/gi, 'derobr');

    // Add the fetch request
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: JSON.stringify({ finalInput }),
    });

    const data = await response.json();

    // If model still loading, display loading message (is this showing a message now?)
    if (response.status === 503) {
      setRetry(data.estimated_time);
      return;
    }
    
    // If another error, display error message
    if (!response.ok) {
      console.log(`Error: ${data.error}`);
      // Stop loading
      setIsGenerating(false);
      return;
    }

    // Set final prompt here
    setFinalPrompt(input); // should this be changed to finalInput as per the final steps in finishing touches??
    // Remove content from input box
    setInput('');
    // Set image data into state property
    setImg(data.image);
    // Everything is all done -- stop loading!
    setIsGenerating(false);
  };

  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
  
  // useEffect block
  useEffect(() => {
    async function runRetry() {
      if (retryCount === 0) {
        console.log(`Model still loading after ${maxRetries} retries. Try request again in 5 minutes.`);
        setRetryCount(maxRetries);
        return;
      }

      console.log(`Trying again in ${retry} seconds.`);

      await sleep(retry * 1000);

      await generateAction();
    }

    if (retry === 0) {
      return;
    }

    runRetry();
  }, [retry]);

  // Render function
  return (
    <div className="root">
      <Head>
        <title>demetra.ai | buildspace</title>
      </Head>
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>demetra's AI art generator 🤙</h1>
          </div>
          <div className="header-subtitle">
            <h2>just call my name in your prompt and see what stable diffusion comes up with</h2>
          </div>
          <div className="prompt-container">
            <input className="prompt-box" value={input} onChange={onChange} /> 
            <div className="prompt-buttons">
              <a
                className={
                  isGenerating ? 'generate-button loading' : 'generate-button'
                }
                onClick={generateAction}
              >
                <div className="generate">
                  {isGenerating ? (
                    <span className="loader"></span>
                  ) : (
                  <p>Generate</p>
                  )}
                </div>
              </a>
            </div>
          </div>
        </div>
        {img && (
          <div className="output-content">
            <Image scr={img} width={512} height={512} alt={finalPrompt} />
            <p>{finalPrompt}</p>
          </div>
        )}
      </div>
      <div className="badge-container grow">
        <a
          href="https://buildspace.so/builds/ai-avatar"
          target="_blank"
          rel="noreferrer"
        >
          <div className="badge">
            <Image src={buildspaceLogo} alt="buildspace logo" />
            <p>build with buildspace</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Home;

