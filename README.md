# 백엔드 API

## 목차

1. [로그인](#1-로그인)<br>
   1.1. [로그인](#11-로그인)<br>
   1.2. [회원가입](#12-회원가입)<br>
   1.3. [회원가입 승인](#13-회원가입-승인)<br>
   1.4. [사용자 삭제](#14-사용자-삭제deprecated)<br>
   1.5. [모든 유저 불러오기](#15-모든-유저-불러오기)
2. [사용자 정보](#2-사용자-정보)<br>
   2.1. [username으로 id 가져오기](#21-username으로-id-가져오기)<br>
   2.2. [id로 사용자 정보 가져오기](#22-id로-사용자-정보-가져오기)<br>
   2.3. [학생 정보 가져오기](#23-학생-정보-가져오기)<br>
   2.4. [기사 정보 가져오기](#24-기사-정보-가져오기)<br>
   2.5. [학생 정보 수정하기](#25-학생-정보-수정하기)<br>
   2.6. [기사 정보 수정하기](#26-기사-정보-수정하기)
3. [위치](#3-위치)<br>
   3.1. [학교 거점 불러오기](#31-학교-거점-불러오기)
4. [사용자 좌표](#4-사용자-좌표)<br>
   4.1. [삽입](#41-삽입)<br>
   4.2. [갱신](#42-갱신)<br>
   4.3. [삭제](#43-삭제)<br>
   4.4. [수집](#44-수집)
5. [호출](#5-호출)<br>
   5.1. [학생이 호출할 때(삽입)](#51-학생이-호출할-때삽입)<br>
   5.2. [호출 기록 가져오기(수집)](#52-호출-기록-가져오기수집)<br>
   5.3. [호출 기록 수정하기](#53-호출-기록-수정하기)<br>
   5.4. [할당되지 않은 호출 가져오기](#54-할당되지-않은-호출-가져오기)<br>
   5.5. [기사가 호출을 받을 때](#55-기사가-호출을-받을-때)<br>
   5.6. [기사가 호출을 끝낼 때](#56-기사가-호출을-끝낼-때)<br>
   5.7. [학생이 호출을 취소할 때](#57-학생이-호출을-취소할-때)

## 1. 로그인

### 1.1. 로그인

### Request

URL

```
GET /sign-in
Host: smartku.net/node
```

Parameter

| Name     | Type   | Description                 | Required |
| -------- | ------ | --------------------------- | -------- |
| username | String | 로그인 아이디               | O        |
| pw       | String | sha3_256으로 해싱한 비밀번호 | X        |

### Response

| Name   | Type                   | Description | Required |
| ------ | ---------------------- | ----------- | -------- |
| status | "fail" \| "notAllowed" | 상태        | X        |
| role   | String                 | 회원 역할   | X        |
| id     | Integer                | 회원 번호   | X        |

### 1.2. 회원가입

### Request

URL

```
POST /sign-up
Host: smartku.net/node
```

Parameter

| Name     | Type   | Description        | Required |
| -------- | ------ | ------------------ | -------- |
| realname | String | 회원 이름          | O        |
| username | String | 회원 아이디        | O        |
| email    | String | 회원 이메일 주소   | O        |
| phone    | String | 회원 휴대전화 번호 | O        |

### Response

| Name         | Type                 | Description                  | Required |
| ------------ | -------------------- | ---------------------------- | -------- |
| status       | "success" \| "error" | 상태                         | O        |
| errorMessage | String               | 회원가입 실패 시 오류 메시지 | X        |

### 1.3. 회원가입 승인

### Request

URL

```
PUT|POST /sign-up-allow
Host: smartku.net/node
```

Parameter

#### 학생의 경우

| Name          | Type      | Description    | Required |
| ------------- | --------- | -------------- | -------- |
| type          | "student" | student로 고정 | O        |
| id            | Integer   | 회원 번호      | O        |
| studentNumber | String    | 학번           | O        |
| major         | String    | 전공           | O        |

#### 기사의 경우

| Name    | Type     | Description   | Required |
| ------- | -------- | ------------- | -------- |
| type    | "driver" | driver로 고정 | O        |
| id      | Integer  | 회원 번호     | O        |
| license | String   | ?             | O        |
| carname | String   | ?             | O        |

### Response

| Name         | Type                 | Description                       | Required |
| ------------ | -------------------- | --------------------------------- | -------- |
| status       | "success" \| "error" | 상태                              | O        |
| errorMessage | String               | 회원가입 승인 실패 시 오류 메시지 | X        |

### 1.4. ~~사용자 삭제~~(deprecated)

### Request

URL

```
DELETE /user
Host: smartku.net/node
```

Parameter

| Name     | Type    | Description      | Required |
| -------- | ------- | ---------------- | -------- |
| password | String  | 관리자 비밀번호  | O        |
| id       | Integer | 삭제할 회원 번호 | O        |

### Response

| Name         | Type                 | Description                   | Required |
| ------------ | -------------------- | ----------------------------- | -------- |
| status       | "success" \| "error" | 상태                          | O        |
| errorMessage | String               | 회원 삭제 실패 시 오류 메시지 | X        |

### 1.5. 모든 유저 불러오기

### Request

URL

```
GET /all-users
Host: smartku.net/node
```

Parameter

| Name     | Type   | Description     | Required |
| -------- | ------ | --------------- | -------- |
| password | String | 관리자 비밀번호 | O        |

### Response

| Name          | Type                                     | Description        | Required |
| ------------- | ---------------------------------------- | ------------------ | -------- |
| id            | Integer                                  | 회원 번호          | O        |
| realname      | String                                   | 회원 이름          | O        |
| username      | String                                   | 회원 아이디        | O        |
| email         | String                                   | 회원 이메일 주소   | O        |
| phone         | String                                   | 회원 휴대전화 번호 | O        |
| role          | "ADMINISTRATOR" \| "DRIVER" \| "STUDENT" | 회원 역할          | O        |
| license       | String                                   | 기사일 때 ?        | X        |
| carname       | String                                   | 기사일 때 ?        | X        |
| studentNumber | String                                   | 학생일 때 학번     | X        |
| major         | String                                   | 학생일 때 전공     | X        |

<hr/>

## 2. 사용자 정보

### 2.1. username으로 id 가져오기

### Request

URL

```
GET /get-id
Host: smartku.net/node
```

Parameter

| Name     | Type   | Description | Required |
| -------- | ------ | ----------- | -------- |
| username | String | 회원 아이디 | O        |

### Response

| Name | Type    | Description | Required |
| ---- | ------- | ----------- | -------- |
| id   | Integer | 회원 번호   | O        |

### 2.2. id로 사용자 정보 가져오기

### Request

URL

```
GET /get-user-info
Host: smartku.net/node
```

Parameter

| Name | Type    | Description | Required |
| ---- | ------- | ----------- | -------- |
| id   | Integer | 회원 번호   | O        |

### Response

| Name          | Type                                     | Description        | Required |
| ------------- | ---------------------------------------- | ------------------ | -------- |
| id            | Integer                                  | 회원 번호          | O        |
| realname      | String                                   | 회원 이름          | O        |
| username      | String                                   | 회원 아이디        | O        |
| email         | String                                   | 회원 이메일 주소   | O        |
| phone         | String                                   | 회원 휴대전화 번호 | O        |
| role          | "ADMINISTRATOR" \| "DRIVER" \| "STUDENT" | 회원 역할          | O        |
| license       | String                                   | 기사일 때 ?        | X        |
| carname       | String                                   | 기사일 때 ?        | X        |
| studentNumber | String                                   | 학생일 때 학번     | X        |
| major         | String                                   | 학생일 때 전공     | X        |

### 2.3. 학생 정보 가져오기

### Request

URL

```
GET /get-student-info
Host: smartku.net/node
```

Parameter

| Name | Type    | Description | Required |
| ---- | ------- | ----------- | -------- |
| id   | Integer | 회원 번호   | O        |

### Response

| Name          | Type    | Description | Required |
| ------------- | ------- | ----------- | -------- |
| id            | Integer | 회원 번호   | O        |
| studentNumber | String  | 학번        | X        |
| major         | String  | 전공        | X        |

### 2.4. 기사 정보 가져오기

### Request

URL

```
GET /get-driver-info
Host: smartku.net/node
```

Parameter

| Name | Type    | Description | Required |
| ---- | ------- | ----------- | -------- |
| id   | Integer | 회원 번호   | O        |

### Response

| Name        | Type    | Description               | Required |
| ----------- | ------- | ------------------------- | -------- |
| carId       | Integer | 자동차의 식별 번호(N호차) | O        |
| license     | String  | 자동차의 번호(00가0000)   | X        |
| phoneNumber | String  | 핸드폰 번호               | X        |
| carname     | String  | 차종                      | X        |

### 2.5. 학생 정보 수정하기

### Request

URL

```
POST /update-student-info
Host: smartku.net/node
```

Parameter

| Name          | Type    | Description | Required |
| ------------- | ------- | ----------- | -------- |
| id            | Integer | 회원 번호   | O        |
| studentNumber | String  | 학번        | O        |
| major         | String  | 전공        | O        |

### Response

| Name         | Type                 | Description                        | Required |
| ------------ | -------------------- | ---------------------------------- | -------- |
| status       | "success" \| "error" | 상태                               | O        |
| errorMessage | String               | 학생 정보 수정 실패 시 오류 메시지 | X        |

### 2.6. 기사 정보 수정하기

### Request

URL

```

Host: smartku.net/node
```

Parameter

| Name    | Type    | Description        | Required |
| ------- | ------- | ------------------ | -------- |
| id      | Integer | 회원 번호          | O        |
| carid   | Integer | 자동차의 식별 번호 | O        |
| license | String  | 자동차의 번호      | O        |
| carname | String  | 차종               | O        |

### Response

| Name         | Type                 | Description                        | Required |
| ------------ | -------------------- | ---------------------------------- | -------- |
| status       | "success" \| "error" | 상태                               | O        |
| errorMessage | String               | 기사 정보 수정 실패 시 오류 메시지 | X        |

<hr/>

## 3. 위치

### 3.1. 학교 거점 불러오기

### Request

URL

```
GET /record-positions|/record-position
Host: smartku.net/node
```

Parameter

없음

### Response

| Name      | Type    | Description               | Required |
| --------- | ------- | ------------------------- | -------- |
| id        | Integer | 각 거점의 고유 할당 번호  | O        |
| lat       | Float   | 위도(호환성 문제)         | O        |
| lng       | Float   | 경도(호환성 문제)         | O        |
| latitude  | Float   | 위도                      | O        |
| longitude | Float   | 경도                      | O        |
| name      | String  | 거점 이름                 | O        |
| campus    | String  | 거점이 위치한 캠퍼스 이름 | O        |

<hr/>

## 4. 사용자 좌표

### 4.1. 삽입

### Request

URL

```
POST /location-insert
Host: smartku.net/node
```

Parameter

| Name      | Type    | Description | Required |
| --------- | ------- | ----------- | -------- |
| id        | Integer | 회원 번호   | O        |
| latitude  | Float   | 위도        | O        |
| longitude | Float   | 경도        | O        |

### Response

| Name         | Type                 | Description                          | Required |
| ------------ | -------------------- | ------------------------------------ | -------- |
| status       | "success" \| "error" | 상태                                 | O        |
| errorMessage | String               | 사용자 좌표 삽입 실패 시 오류 메시지 | X        |

### 4.2. 갱신

### Request

URL

```
POST /location-update
Host: smartku.net/node
```

Parameter

| Name      | Type    | Description | Required |
| --------- | ------- | ----------- | -------- |
| id        | Integer | 회원 번호   | O        |
| latitude  | Float   | 위도        | O        |
| longitude | Float   | 경도        | O        |

### Response

| Name         | Type                 | Description                          | Required |
| ------------ | -------------------- | ------------------------------------ | -------- |
| status       | "success" \| "error" | 상태                                 | O        |
| errorMessage | String               | 사용자 좌표 갱신 실패 시 오류 메시지 | X        |

### 4.3. 삭제

### Request

URL

```
POST /location-delete
Host: smartku.net/node
```

Parameter

| Name | Type    | Description | Required |
| ---- | ------- | ----------- | -------- |
| id   | Integer | 회원 번호   | O        |

### Response

| Name         | Type                 | Description                          | Required |
| ------------ | -------------------- | ------------------------------------ | -------- |
| status       | "success" \| "error" | 상태                                 | O        |
| errorMessage | String               | 사용자 좌표 삭제 실패 시 오류 메시지 | X        |

### 4.4. 수집

### Request

URL

```
GET /get-location
Host: smartku.net/node
```

Parameter

| Name | Type    | Description | Required |
| ---- | ------- | ----------- | -------- |
| id   | Integer | 회원 번호   | O        |

### Response

| Name         | Type                 | Description                          | Required |
| ------------ | -------------------- | ------------------------------------ | -------- |
| latitude     | Float                | 경도                                 | O        |
| longitude    | Float                | 위도                                 | O        |
| status       | "success" \| "error" | 상태                                 | X        |
| errorMessage | String               | 사용자 좌표 수집 실패 시 오류 메시지 | X        |

<hr/>

## 5. 호출

### 5.1. 학생이 호출할 때(삽입)

### Request

URL

```
POST /call-request
Host: smartku.net/node
```

Parameter

| Name             | Type    | Description           | Required |
| ---------------- | ------- | --------------------- | -------- |
| id               | Integer | 회원 번호             | O        |
| departureNo      | Integer | 출발지 거점 번호      | O        |
| arrivalNo        | Integer | 도착지 거점 번호      | O        |
| isWheelchairSeat | boolean | 휠체어 좌석 선택 여부 | O        |

### Response

| Name   | Type    | Description                    | Required |
| ------ | ------- | ------------------------------ | -------- |
| callNo | Integer | 학생이 보낸 호출에 배정된 번호 | O        |

### 5.2. 호출 기록 가져오기(수집)

### Request

URL

```
GET /call-status
Host: smartku.net/node
```

Parameter

| Name   | Type    | Description                    | Required |
| ------ | ------- | ------------------------------ | -------- |
| callNo | Integer | 학생이 보낸 호출에 배정된 번호 | O        |

### Response

| Name         | Type                                                                 | Description                        | Required |
| ------------ | -------------------------------------------------------------------- | ---------------------------------- | -------- |
| callSuccess  | Boolean                                                              | 배차 성공 여부                     | O        |
| driverId     | Integer                                                              | 배차 성공 시 기사 번호             | X        |
| callStatus   | "cancelled" \| "waiting" \|<br>"allocated" \| "moving" \| "finished" | 호출 상태                          | O        |
| status       | "success" \| "error"                                                 | 상태                               | X        |
| errorMessage | String                                                               | 호출 기록 수집 실패 시 오류 메시지 | X        |

### 5.3. 호출 기록 수정하기

### Request

URL

```
PUT /call-status
or
POST /change-call-status
Host: smartku.net/node
```

Parameter

| Name       | Type                                                                 | Description        | Required |
| ---------- | -------------------------------------------------------------------- | ------------------ | -------- |
| callNo     | Integer                                                              | 호출에 배정된 번호 | O        |
| callStatus | "cancelled" \| "waiting" \|<br>"allocated" \| "moving" \| "finished" | 호출 상태          | O        |

### Response

| Name         | Type                 | Description                        | Required |
| ------------ | -------------------- | ---------------------------------- | -------- |
| status       | "success" \| "error" | 상태                               | O        |
| errorMessage | String               | 호출 기록 수정 실패 시 오류 메시지 | X        |

### 5.4. 할당되지 않은 호출 가져오기

### Request

URL

```
GET /no-driver-call
Host: smartku.net/node
```

Parameter

없음

### Response

| Name             | Type    | Description        | Required |
| ---------------- | ------- | ------------------ | -------- |
| studentId        | Integer | 학생 고유 번호     | O        |
| callNo           | Integer | 호출에 배정된 번호 | O        |
| name             | String  | 학생 이름          | O        |
| email            | String  | 학생 이메일        | O        |
| phoneNumber      | String  | 학생 휴대전화 번호 | O        |
| time             | String  | 호출 시간          | O        |
| departure        | String  | 출발지명           | O        |
| arrival          | String  | 도착지명           | O        |
| isWheelchairSeat | Boolean | 휠체어석 선택 여부 | O        |

### 5.5. 호출 정보 가져오기

### Request

URL

```
GET /call-info
Host: smartku.net/node
```

Parameter

| Name | Type    | Description        | Required |
| ---- | ------- | ------------------ | -------- |
| id   | Integer | 호출에 배정된 번호 | O        |

### Response

| Name             | Type    | Description             | Required |
| ---------------- | ------- | ----------------------- | -------- |
| studentId        | Integer | 학생 고유 번호          | O        |
| callNo           | Integer | 호출에 배정된 번호      | O        |
| name             | String  | 학생 이름               | O        |
| email            | String  | 학생 이메일             | O        |
| phoneNumber      | String  | 학생 휴대전화 번호      | O        |
| time             | String  | 호출 시간               | O        |
| departure        | String  | 출발지명                | O        |
| arrival          | String  | 도착지명                | O        |
| isWheelchairSeat | Boolean | 휠체어석 선택 여부      | O        |
| driverId         | Integer | 드라이버 id             | O        |
| driverName       | String  | 드라이버 이름(realname) | O        |

### 5.6. 기사가 호출을 받을 때

### Request

URL

```
POST /call-accept
Host: smartku.net/node
```

Parameter

| Name     | Type    | Description        | Required |
| -------- | ------- | ------------------ | -------- |
| callNo   | Integer | 호출에 배정된 번호 | O        |
| driverId | Integer | 기사 고유 번호     | O        |

### Response

| Name         | Type                 | Description                   | Required |
| ------------ | -------------------- | ----------------------------- | -------- |
| status       | "success" \| "error" | 상태                          | O        |
| errorMessage | String               | 호출 수락 실패 시 오류 메시지 | X        |

### 5.7. 기사가 호출을 끝낼 때

### Request

URL

```
POST /call-end
Host: smartku.net/node
```

Parameter

| Name   | Type    | Description        | Required |
| ------ | ------- | ------------------ | -------- |
| callNo | Integer | 호출에 배정된 번호 | O        |

### Response

| Name         | Type                 | Description                   | Required |
| ------------ | -------------------- | ----------------------------- | -------- |
| status       | "success" \| "error" | 상태                          | O        |
| errorMessage | String               | 호출 종료 실패 시 오류 메시지 | X        |

### 5.8. 학생이 호출을 취소할 때

### Request

URL

```
POST /call-cancel
Host: smartku.net/node
```

Parameter

| Name   | Type    | Description        | Required |
| ------ | ------- | ------------------ | -------- |
| callNo | Integer | 호출에 배정된 번호 | O        |

### Response

| Name         | Type                 | Description                   | Required |
| ------------ | -------------------- | ----------------------------- | -------- |
| status       | "success" \| "error" | 상태                          | O        |
| errorMessage | String               | 호출 취소 실패 시 오류 메시지 | X        |
