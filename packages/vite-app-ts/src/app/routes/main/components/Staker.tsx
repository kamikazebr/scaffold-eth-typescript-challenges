import { StaticJsonRpcProvider, TransactionRequest, TransactionResponse } from '@ethersproject/providers';
import { NotificationMessage, transactor, TRawTxError } from 'eth-components/functions';
import { useBalance, useContractLoader, useEventListener, useGasPrice, useOnRepetition } from 'eth-hooks';
import { useEthersContext } from 'eth-hooks/context';
import React, { FC, useContext, useEffect, useState } from 'react';
import { useAppContracts } from '../hooks/useAppContracts';
import { Staker as StakerContract, ExampleExternalContract } from '~~/generated/contract-types';
import { Button, List } from 'antd';
import { Address, Balance } from 'eth-components/ant';
import { formatEther, parseEther } from '@ethersproject/units';
import { BigNumber } from 'ethers';
import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';
import { ethers } from 'ethers';
import { EthComponentsSettingsContext } from 'eth-components/models';
import { useDexEthPrice } from 'eth-hooks/dapps';
import { Deferrable } from 'ethers/lib/utils';
import { TypedEvent } from 'eth-hooks/models/providerTypes';

const langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
const humanizer: HumanizeDuration = new HumanizeDuration(langService);

export interface StakerProps {
  mainnetProvider: StaticJsonRpcProvider;
}

export const Staker: FC<StakerProps> = (props) => {
  const { mainnetProvider } = props;

  const appContractConfig = useAppContracts();
  const ethersContext = useEthersContext();
  const readContracts = useContractLoader(appContractConfig);
  const writeContracts = useContractLoader(appContractConfig, ethersContext?.signer);

  const yourCurrentBalance = useBalance(ethersContext.account ?? '');

  const stakeContractRead = readContracts['Staker'] as StakerContract;
  const stakeContractWrite = writeContracts['Staker'] as StakerContract;
  const externalContractRead = readContracts['ExampleExternalContract'] as ExampleExternalContract;

  const ethComponentsSettings = useContext(EthComponentsSettingsContext);
  const gasPrice = useGasPrice(ethersContext.chainId, 'fast');
  const ethPrice = useDexEthPrice(mainnetProvider);
  // const ethPrice = 1;
  const txWithoutThrow = transactor(ethComponentsSettings, ethersContext?.signer, gasPrice, undefined, false);
  const txWithThrow = transactor(
    ethComponentsSettings,
    ethersContext?.signer,
    gasPrice,
    undefined,
    true
    // (err: TRawTxError, notifMessage: NotificationMessage) => {
    //   const errorContent = err.data ? err.data.message ?? err.message : err.message;
    //   const extractedReason = new RegExp(/reverted with reason string \'(.*?)\'/).exec(errorContent);

    //   if (extractedReason && extractedReason.length > 0) {
    //     console.log('desc:', extractedReason[1]);
    //     notifMessage.description = extractedReason[1];
    //   }
    //   return notifMessage;
    // }
  );

  const tx = async (
    tx: Deferrable<TransactionRequest> | Promise<TransactionResponse>,
    callback?: ((_param: any) => void) | undefined
  ) => {
    try {
      if (!txWithThrow) {
        throw new Error("txWithoutCatch it's not defined");
      }
      return await txWithThrow(tx, callback);
    } catch (e) {
      const err = e as TRawTxError;

      const errorContent = err.data ? err.data.message ?? err.message : err.message;
      const extractedReason = new RegExp(/reverted with reason string \'(.*?)\'/).exec(errorContent);

      console.log('TxERR:', errorContent);
      console.log('extractedReason:', extractedReason);
      if (extractedReason && extractedReason.length > 0) {
        console.log('desc:', extractedReason[1]);
      }
    }
  };

  const [threshold, setThreshold] = useState<BigNumber>();
  useEffect(() => {
    const getThreshold = async () => {
      const threshold = await stakeContractRead?.threshold();
      console.log('💵 threshold:', threshold);
      setThreshold(threshold);
    };
    getThreshold();
  }, [yourCurrentBalance]);

  const [balanceStaked, setBalanceStaked] = useState<BigNumber>();
  useEffect(() => {
    const getBalanceStaked = async () => {
      const balanceStaked = await stakeContractRead?.balances(ethersContext?.account ?? '');
      console.log('💵 balanceStaked:', balanceStaked);
      setBalanceStaked(balanceStaked);
    };
    getBalanceStaked();
  }, [yourCurrentBalance]);

  const [timeLeft, setTimeLeft] = useState<BigNumber>();
  useEffect(() => {
    const getTimeLeft = async () => {
      const timeLeft = await stakeContractRead?.timeLeft();
      console.log('⏳ timeLeft:', timeLeft);
      setTimeLeft(timeLeft);
    };
    getTimeLeft();
  }, [yourCurrentBalance]);

  const [completed, setCompleted] = useState<boolean>(false);
  useEffect(() => {
    const getCompleted = async () => {
      const completed = await externalContractRead?.completed();
      console.log('✅ complete:', completed);
      setCompleted(completed);
    };
    getCompleted();
  }, [yourCurrentBalance]);

  // ** 📟 Listen for broadcast events
  const stakeEvents = useEventListener(stakeContractRead, 'Stake', 1);

  let completeDisplay = <></>;
  if (completed) {
    completeDisplay = (
      <div style={{ padding: 64, backgroundColor: '#eeffef', fontWeight: 'bolder' }}>
        🚀 🎖 👩‍🚀 - Staking App triggered `ExampleExternalContract` -- 🎉 🍾 🎊
        <Balance address={externalContractRead?.address} /> ETH staked!
      </div>
    );
  }
  return (
    <div>
      {completeDisplay}

      <div style={{ padding: 8, marginTop: 32 }}>
        <div>Staker Contract:</div>
        <Address address={stakeContractRead?.address} />
      </div>

      <div style={{ padding: 8, marginTop: 32 }}>
        <div>Timeleft:</div>
        {timeLeft && humanizer.humanize(timeLeft.toNumber() * 1000)}
      </div>

      <div style={{ padding: 8 }}>
        <div>Total staked:</div>
        <Balance address={stakeContractRead?.address} />/
        <Balance address={undefined} balance={threshold} />
      </div>

      <div style={{ padding: 8 }}>
        <div>You staked:</div>
        <Balance address={undefined} balance={balanceStaked} price={ethPrice} />
      </div>

      <div style={{ padding: 8 }}>
        <Button
          type={'default'}
          onClick={async () => {
            if (tx) {
              const result = (await tx(stakeContractWrite.execute())) as TransactionResponse | undefined;
              // if (result) {
              console.log('result', result?.value);
              // }
            }
          }}>
          📡 Execute!
        </Button>
      </div>

      <div style={{ padding: 8 }}>
        <Button
          type={'default'}
          onClick={() => {
            if (tx && ethersContext.account) {
              tx(stakeContractWrite.withdraw(ethersContext.account));
            }
          }}>
          🏧 Withdraw
        </Button>
      </div>

      <div style={{ padding: 8 }}>
        <Button
          type={balanceStaked ? 'primary' : 'default'}
          onClick={() => {
            if (tx) {
              tx(stakeContractWrite.stake({ value: ethers.utils.parseEther('0.5') }));
            }
          }}>
          🥩 Stake 0.5 ether!
        </Button>
      </div>

      <div style={{ width: 600, margin: 'auto', marginTop: 32, paddingBottom: 32 }}>
        <h2>Events:</h2>
        <List
          bordered
          dataSource={stakeEvents}
          renderItem={(item: TypedEvent<ethers.utils.Result>) => {
            return (
              <List.Item key={'key_' + item.blockNumber} style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  <Address address={item.args[0]} ensProvider={mainnetProvider} fontSize={16} />
                  <div>→</div>
                  <div>{formatEther(item.args[1])}</div>
                </div>
              </List.Item>
            );
          }}
        />
      </div>
    </div>
  );
};
