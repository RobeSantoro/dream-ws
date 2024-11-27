export type WorkflowNode = {
  inputs: Record<string, unknown>;
  class_type: string;
  _meta: {
    title: string;
  };
};

export type WorkflowData = {
  [key: string]: WorkflowNode;
};

export const prompt: WorkflowData = {
  "5": {
    "inputs": {
      "width": 512,
      "height": 512,
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage",
    "_meta": {
      "title": "Empty Latent Image"
    }
  },
  "6": {
    "inputs": {
      "text": "a painting by Monet, impressionism, masterpiece",
      "clip": [
        "20",
        1
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "positive"
    }
  },
  "7": {
    "inputs": {
      "text": "text, watermark",
      "clip": [
        "20",
        1
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Prompt)"
    }
  },
  "8": {
    "inputs": {
      "samples": [
        "13",
        0
      ],
      "vae": [
        "20",
        2
      ]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE Decode"
    }
  },
  "13": {
    "inputs": {
      "add_noise": true,
      "noise_seed": 123456790,
      "cfg": 1,
      "model": [
        "20",
        0
      ],
      "positive": [
        "6",
        0
      ],
      "negative": [
        "7",
        0
      ],
      "sampler": [
        "14",
        0
      ],
      "sigmas": [
        "22",
        0
      ],
      "latent_image": [
        "5",
        0
      ]
    },
    "class_type": "SamplerCustom",
    "_meta": {
      "title": "SamplerCustom"
    }
  },
  "14": {
    "inputs": {
      "sampler_name": "euler_ancestral"
    },
    "class_type": "KSamplerSelect",
    "_meta": {
      "title": "KSamplerSelect"
    }
  },
  "20": {
    "inputs": {
      "ckpt_name": "SDXL\\sd_xl_turbo_1.0_fp16.safetensors"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": {
      "title": "Load Checkpoint"
    }
  },
  "22": {
    "inputs": {
      "steps": 1,
      "denoise": 1,
      "model": [
        "20",
        0
      ]
    },
    "class_type": "SDTurboScheduler",
    "_meta": {
      "title": "SDTurboScheduler"
    }
  },
  "31": {
    "inputs": {
      "images": [
        "8",
        0
      ]
    },
    "class_type": "SaveImageWebsocket",
    "_meta": {
      "title": "SaveImageWebsocket"
    }
  }
};

export const SaveImage: WorkflowData = {
  33: {
    inputs: {
      filename_prefix: "ComfyUI",
      images: ["8", 0],
    },
    class_type: "SaveImage",
    _meta: {
      title: "Save Image",
    },
  },
};
