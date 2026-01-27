
import React from 'react';
import { Service } from './types';

export const SERVICES: Service[] = [
  {
    id: 'fio-a-fio',
    name: 'Fio a Fio',
    price: 'R$ 130,00',
    description: 'A técnica clássica para um realce natural.',
    longDescription: 'A técnica clássica Fio a Fio consiste na aplicação de uma extensão sintética em cada cílio natural, proporcionando um olhar realçado com naturalidade e sofisticação. Ideal para quem busca definir o olhar e aumentar o comprimento sem perder a leveza.',
    duration: '2h',
    maintenance: '15 a 20 dias',
    image: 'https://picsum.photos/seed/lash1/600/800'
  },
  {
    id: 'volume-egipcio',
    name: 'Volume Egípcio',
    price: 'R$ 130,00',
    description: 'Fios em formato de Y para volume intermediário.',
    longDescription: 'O Volume Egípcio utiliza fios tecnológicos em formato de Y que garantem o preenchimento ideal com leveza. Proporciona um olhar marcante e sofisticado com durabilidade incomparável.',
    duration: '2h',
    maintenance: '20 a 25 dias',
    image: 'https://picsum.photos/seed/lash2/600/800'
  },
  {
    id: 'volume-russo',
    name: 'Volume Russo',
    price: 'R$ 130,00',
    description: 'Máxima densidade e glamour para o seu olhar.',
    longDescription: 'A técnica de Volume Russo proporciona um olhar dramático e sofisticado. Ideal para quem busca máxima densidade, preenchimento total e um acabamento impecável com fios ultraleves aplicados em leques.',
    duration: '2h',
    maintenance: '15 a 20 dias',
    image: 'https://picsum.photos/seed/lash3/600/800'
  },
  {
    id: 'volume-brasileiro',
    name: 'Volume Brasileiro',
    price: 'R$ 130,00',
    description: 'Técnica queridinha para volume e leveza.',
    longDescription: 'O Volume Brasileiro é a técnica queridinha do momento. Utiliza fios em formato de "YY", que proporcionam um efeito de volume superior ao clássico, mantendo a leveza e naturalidade.',
    duration: '2h',
    maintenance: '20 dias',
    image: 'https://picsum.photos/seed/lash4/600/800'
  }
];

export const OrnamentalSVG = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="currentColor">
    <path d="M0,0 C20,0 40,5 50,20 C60,35 60,60 50,80 C40,90 20,100 0,100 L0,0 Z"></path>
  </svg>
);
