import React from 'react';
import WebAudioDemo from '@/components/WebAudioDemo';
import { sounds } from '@/data/sounds';
import { soundMixes } from '@/data/soundMixes';

const WebAudioTest: React.FC = () => {
  return (
    <div>
      <WebAudioDemo allSounds={sounds} soundMixes={soundMixes} />
    </div>
  );
};

export default WebAudioTest;