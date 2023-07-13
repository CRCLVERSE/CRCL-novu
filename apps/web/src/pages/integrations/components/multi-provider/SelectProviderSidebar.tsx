import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Group, Image, Space, Stack, Tabs, TabsValue, useMantineColorScheme } from '@mantine/core';
import {
  ChannelTypeEnum,
  emailProviders,
  smsProviders,
  pushProviders,
  inAppProviders,
  chatProviders,
} from '@novu/shared';

import { colors, Sidebar } from '../../../../design-system';
import { Button, Input, Title, Tooltip, Text } from '../../../../design-system';
import { getGradient } from '../../../../design-system/config/helper';
import { Search } from '../../../../design-system/icons';
import useStyles from '../../../../design-system/tabs/Tabs.styles';
import { useDebounce } from '../../../../hooks';
import { ChannelTitle } from '../../../templates/components/ChannelTitle';
import { CHANNELS_ORDER } from '../IntegrationsListNoData';
import { CHANNEL_TYPE_TO_STRING } from '../../../../utils/channels';
import { getLogoFileName } from '../../../../utils/providers';
import { sortProviders } from './sort-providers';
import { When } from '../../../../components/utils/When';
import { CONTEXT_PATH } from '../../../../config';
import { IIntegratedProvider } from '../../IntegrationsStorePage';

const filterSearch = (list, search: string) =>
  list.filter((prov) => prov.displayName.toLowerCase().includes(search.toLowerCase()));

const mapStructure = (listProv): IIntegratedProvider[] =>
  listProv.map((providerItem) => ({
    providerId: providerItem.id,
    displayName: providerItem.displayName,
    channel: providerItem.channel,
    docReference: providerItem.docReference,
  }));

export function SelectProviderSidebar() {
  const [providersList, setProvidersList] = useState({
    [ChannelTypeEnum.EMAIL]: mapStructure(emailProviders),
    [ChannelTypeEnum.SMS]: mapStructure(smsProviders),
    [ChannelTypeEnum.PUSH]: mapStructure(pushProviders),
    [ChannelTypeEnum.IN_APP]: mapStructure(inAppProviders),
    [ChannelTypeEnum.CHAT]: mapStructure(chatProviders),
  });

  const [selectedProvider, setSelectedProvider] = useState<IIntegratedProvider | null>(null);
  const { classes: tabsClasses } = useStyles(false);

  const debouncedSearchChange = useDebounce((search: string) => {
    setProvidersList({
      [ChannelTypeEnum.EMAIL]: filterSearch(providersList[ChannelTypeEnum.EMAIL], search),
      [ChannelTypeEnum.SMS]: filterSearch(providersList[ChannelTypeEnum.SMS], search),
      [ChannelTypeEnum.PUSH]: filterSearch(providersList[ChannelTypeEnum.PUSH], search),
      [ChannelTypeEnum.IN_APP]: filterSearch(providersList[ChannelTypeEnum.IN_APP], search),
      [ChannelTypeEnum.CHAT]: filterSearch(providersList[ChannelTypeEnum.CHAT], search),
    });
  }, 500);

  const emptyProvidersList = Object.values(providersList).every((list) => list.length === 0);

  const navigate = useNavigate();

  const onProviderClick = (provider) => () => setSelectedProvider(provider);

  const onTabChange = (scrollTo: TabsValue) => {
    if (scrollTo === null) {
      return;
    }

    const element = document.getElementById(scrollTo);

    element?.parentElement?.scrollTo({
      behavior: 'smooth',
      top: element?.offsetTop ? element?.offsetTop - 250 : undefined,
    });
  };

  const onCloseSidebar = () => {
    navigate('/integrations');
  };

  return (
    <Sidebar
      isOpened
      onClose={onCloseSidebar}
      customHeader={
        <Stack spacing={8}>
          {selectedProvider !== null ? (
            <>
              <Group spacing={12} h={40}>
                <ProviderImage providerId={selectedProvider.providerId} />
                <Title size={2}>{selectedProvider.displayName}</Title>
              </Group>
              <Text color={colors.B40}>
                A provider instance for {CHANNEL_TYPE_TO_STRING[selectedProvider.channel]} channel
              </Text>
            </>
          ) : (
            <>
              <Group h={40}>
                <Title size={2}>Select a provider</Title>
              </Group>
              <Text color={colors.B40}>Select a provider to create instance for a channel</Text>
            </>
          )}
        </Stack>
      }
      customFooter={
        <Group ml="auto">
          <Button variant={'outline'} onClick={onCloseSidebar}>
            Cancel
          </Button>
          <Tooltip sx={{ position: 'absolute' }} disabled={selectedProvider !== null} label={'Select a provider'}>
            <span>
              <Button
                disabled={selectedProvider === null}
                onClick={() => {
                  if (selectedProvider === null) {
                    return;
                  }
                  navigate(`/integrations/create/${selectedProvider?.channel}/${selectedProvider?.providerId}`);
                }}
              >
                Next
              </Button>
            </span>
          </Tooltip>
        </Group>
      }
    >
      <SelectProviderBodyContainer>
        <Input
          type={'search'}
          onChange={(e) => {
            debouncedSearchChange(e.target.value);
          }}
          mb={20}
          placeholder={'Search a provider...'}
          rightSection={<Search />}
        />
        <Tabs defaultValue={ChannelTypeEnum.IN_APP} classNames={tabsClasses} onTabChange={onTabChange}>
          <Tabs.List>
            {CHANNELS_ORDER.map((channelType) => {
              const list = providersList[channelType];

              return (
                <Tabs.Tab key={channelType} hidden={list.length === 0} value={channelType}>
                  <ChannelTitle spacing={5} channel={channelType} />
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs>
        <Space h={20} />
        <CenterDiv>
          <When truthy={emptyProvidersList}>
            <Image src={`${CONTEXT_PATH}/static/images/empty-provider-search.svg`} />
          </When>
          {!emptyProvidersList &&
            CHANNELS_ORDER.map((channelType) => {
              return (
                <ListProviders
                  key={channelType}
                  selectedProvider={selectedProvider}
                  onProviderClick={onProviderClick}
                  channelProviders={providersList[channelType]}
                  channelType={channelType}
                />
              );
            })}
        </CenterDiv>
      </SelectProviderBodyContainer>
    </Sidebar>
  );
}

export const ProviderImage = ({ providerId }) => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <img
      src={getLogoFileName(providerId, colorScheme)}
      alt={providerId}
      style={{
        height: '24px',
        maxWidth: '24px',
        width: '24px',
      }}
    />
  );
};

const ListProviders = ({
  channelProviders,
  channelType,
  onProviderClick,
  selectedProvider,
}: {
  channelProviders: IIntegratedProvider[];
  channelType: ChannelTypeEnum;
  onProviderClick: (provider: IIntegratedProvider) => () => void;
  selectedProvider: IIntegratedProvider | null;
}) => {
  const providers = useMemo(() => {
    return channelProviders.sort(sortProviders(channelType));
  }, [channelProviders, channelType]);

  return (
    <Stack hidden={providers.length === 0} pb={20} spacing={10} id={channelType}>
      <ChannelTitle spacing={8} channel={channelType} />
      <div>
        {providers.map((provider) => {
          return (
            <StyledButton
              key={provider.providerId}
              onClick={onProviderClick(provider)}
              selected={provider.providerId === selectedProvider?.providerId}
            >
              <Group>
                <ProviderImage providerId={provider.providerId} />
                <Text>{provider.displayName}</Text>
              </Group>
            </StyledButton>
          );
        })}
      </div>
    </Stack>
  );
};

export const Footer = styled.div`
  display: flex;
  justify-content: right;
  align-items: center;
`;

const CenterDiv = styled.div`
  overflow: auto;
  color: ${colors.B60};
  font-size: 14px;
  line-height: 20px;
`;

const SelectProviderBodyContainer = styled.form`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;

  > *:last-child {
    margin-top: auto;
  }
`;

const StyledButton = styled.div<{ selected: boolean }>`
  width: 100%;
  padding: 15px;
  background-color: ${({ theme }) => (theme.colorScheme === 'dark' ? colors.B20 : colors.B98)};
  border-radius: 8px;

  color: ${({ theme }) => (theme.colorScheme === 'dark' ? colors.white : colors.B40)};
  border: 1px solid transparent;

  margin-bottom: 12px;
  line-height: 1;

  ${({ selected, theme }) => {
    return selected
      ? `
           background: ${
             theme.colorScheme === 'dark' ? getGradient(colors.B20) : getGradient(colors.B98)
           } padding-box, ${colors.horizontal} border-box;
      `
      : undefined;
  }};
`;

export const SideBarWrapper = styled.div`
  background-color: ${({ theme }) => (theme.colorScheme === 'dark' ? colors.B17 : colors.white)} !important;
  position: absolute;
  z-index: 1;
  width: 480px;
  top: 0;
  bottom: 0;
  right: 0;
  padding: 24px;
`;
